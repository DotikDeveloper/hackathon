const express = require ('express');
const mongoose = require ('mongoose');
const morgan = require ('morgan');
const path = require ('path');
const cookieParser = require ('cookie-parser');
import fs from 'fs';
import moment from 'moment-timezone';
import {get as safeGet} from 'lodash';
import './packages';
import pretty from "../../lib/pretty";
if (process.env.PATH_CONSOLE === '1') {
    let names = ['log'];
    _.each(names,(name)=>{
        let original = console[name];
        console[name] = function(){
            let prefix = moment(new Date()).tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss SS');
            return original.apply(console,[prefix,...arguments])
        }
    });
}
//import cluster from './cluster';
import '../mongoConnection';

import passport from 'passport';
import sessionHandler from "./sessionHandler";
import _ from 'underscore';
import {express as voyagerMiddleware} from 'graphql-voyager/middleware';
import metrics from './../metrics';
import {createServer} from 'http';
import jwt from 'jsonwebtoken';


export default new Promise (resolve => {
//cluster(function(worker) {
    const app = express ();
    app.set('json spaces', 4)
    app.unsetRoute = function(path){
        const stack = app._router.stack;
        let layers = [];
        let indexes = [];
        _.each(stack,(layer,index)=>{
            if(
                layer.route && layer.route.path === path
            ){
                layers.push(layer);
                indexes.push(index);
            }
        });

        _.chain(indexes)
        .sortBy((index)=>{return -index})
        .each((index)=>{
            stack.splice(index, 1)
        });

        let rollback = function(){
            _.each(layers,(layer)=>{
                stack.push(layer);
            })
        };
        rollback.layers = layers;
        rollback.size = layers.length;
        return rollback;
    };

    app.addDynamicRoute = function(method,path,handler){
        if(!method||!_.isFunction(app[method]))
            throw new Error(`Неизвестный метод ${method}`);
        let setWildcatRoutes = app.unsetRoute('*');
        app.unsetRoute(path);

        let result = app[method].apply(app,[path,handler]);
        setWildcatRoutes();
        return result;
    };

    app.use (function (req, res, next) {
        /*
        let endOriginal = res.end;
        res.end = function(){
            if(Buffer.isBuffer(arguments[0])){
                let buffer = arguments[0];
                console.log('buffer:',buffer.toString('utf8'));
            }else if(arguments[0]){
                console.log(JSON.stringify(arguments));
            }
            return endOriginal.apply(res,arguments);
        }

        let sendOriginal = res.send;
        res.send = function(){
            let contentType = res.getHeader('content-type');
            let newArgs = arguments;
            if(contentType&&contentType.indexOf('application/json')>-1) {
                if (Buffer.isBuffer (arguments[0])) {
                    let buffer = arguments[0];
                    console.log ('buffer:', buffer.toString ('utf8'));
                } else if (_.isString (arguments[0])) {

                    try {
                        let parsed = JSON.parse(arguments[0]);
                        //newArgs[0] = pretty(parsed);
                    }catch (e) {
                        console.error(e);
                    }

                }
            }
            return sendOriginal.apply(res,newArgs);
        }
*/
        Object.defineProperty (req, 'originalHeaders', {
            enumerable: false,
            get: function () {
                let headers = {};
                for (let i = 0; i < this.rawHeaders.length; i++) {
                    if (i % 2 === 0) {
                        let key = this.rawHeaders[i];
                        if (key)
                            headers[this.rawHeaders[i]] = this.rawHeaders[i + 1];
                    }
                }
                return headers;
            }
        });

        Object.defineProperty (req, 'requestOptions', {
            enumerable: false,
            get: function () {
                let Host = this.get ('Host');
                let port = this.protocol === 'https' ? 443 : 80;
                let hostData = Host.split (':');
                if (_.size (hostData) > 1) {
                    let _port = Number (_.last (hostData));
                    if (!_.isNaN (_port)) {
                        port = _port;
                    }
                }
                return {
                    method: this.method,
                    path: this.path,
                    headers: this.originalHeaders,
                    port: port,
                    hostname: this.hostname,
                    host: this.host,
                    followRedirect: false
                }
            }
        });

        Object.defineProperty (req, 'absoluteUrl', {
            enumerable: false,
            get: function () {
                return this.protocol + "://" + this.get ('Host') + this.originalUrl;
            }
        });

        return next ();
    });

    //expressWs(app);
    const cors = require ('cors');

    app.use (function logErrors (err, req, res, next) {
        if (err)
            console.trace (err);
        next (err);
    });

    app.use (cors ({
        origin: true,
        credentials: true,
    }));

    app.set ('port', Number (process.env.PORT));

    app.use (morgan ('dev'));

    app.use (function (req, res, next) {
        let defaultOrigin = process.env.BASE_URL.replace (/\\$/gi, '');
        res.header ('Access-Control-Allow-Origin', req.header ('origin') || defaultOrigin);
        next ();
    });

    app.use ('/voyager', voyagerMiddleware ({endpointUrl: '/graphql'}));

    metrics (app);
    mongoose.connection.once ('open', async function () {
        const mongooseProtectionPlugin = require('/server/mPlugins/protectionPlugin').default;
        mongoose.plugin (mongooseProtectionPlugin);

        const mongooseSandboxPlugin = require ('/server/mPlugins/mongooseSandboxPlugin').default;
        mongoose.plugin (mongooseSandboxPlugin);

        const Users = require('/modules/account/Users').default;

        app.use (sessionHandler());
        const balancer = require ("/modules/cluster/balancer").default;
        app.use (balancer);

        let jsonMiddleware = express.json ();
        app.use (function(req, res, next) {
            if(req.query.json==='false'||req.query.json===false||req.originalUrl.indexOf('skipjson')>-1) {
                console.log('skip express.json for ',req.absoluteUrl);
                return next ();
            }
            return jsonMiddleware.apply(this,arguments);
        });
        app.use (express.urlencoded ({extended: false}));
        app.use (cookieParser ());

        const settings = require('/server/account/auth.config').default;
        app.use(async function(req, res, next){

            let token = req.cookies.jwtToken || req.headers.jwtToken;
            if(token&&_.isString(token)){
                token = token.replace(/^JWT\s* /gi,'');
            }else
                return next();
            try {
                let decoded = jwt.verify(token, settings.secret);
                if(decoded&&decoded._id){
                    req.user = await Users.findOne({_id:decoded._id});
                }
                next();
            } catch(err) {
                return next();
            }
        });

        app.use (passport.initialize ());
        //app.use (passport.session ());

        app.use(require('/modules/account/server/routes').default);
        app.use (require ('/modules/generator').router);
        app.use (require ('/modules/tmpfiles').router);
        app.use (require ('/modules/files').router);
        app.use (require ('/modules/menu/server/routes').router);
        app.use(require('/modules/settings/server/routes').default);
        app.use(require('/modules/custom/server/router').default);
        app.use(require('/modules/food/server/routes').default);
        const auth = require ('./../account/routes').default;
        app.use ('/', auth);
        const ability = require("../../modules/acl2").ability;
        app.use (async function (req, res, next) {
            let user = safeGet (req, 'session.user', null);
            if (req.originalUrl) {
                if (req.originalUrl.indexOf ('/jsdoc/') > -1) {
                    const error = '403 - Недостаточно прав для просмотра этой страницы';
                    if (!user) {
                        return next (error);
                    }
                    let canView = await ability({collection:{name:'documentation'}},'view',{user});
                    if(!canView)
                        return next(error);
                    if(req.originalUrl.indexOf ('.js.html') > -1){
                        let canViewSource = await ability({collection:{name:'documentation'}},'source',{user});
                        if(!canViewSource)
                            return next(error);
                    }
                }
            }
            next ();
        });
        app.use ('/', express.static (process.env.FRONTEND_DIR));

        const apolloServer = require ("./../apollo/server").server;
        apolloServer.applyMiddleware ({app, cors: false});

        const coreLoad = require ('./corePreload').default;
        await coreLoad ();

        require ('./corePostLoad');
        if (process.env.dev === '1') {
            require ('./dev');
        }
        const server = createServer (app);
        apolloServer.installSubscriptionHandlers (server);
        server.listen (app.get ('port'), function () {
            let handle = function indexRoute(req, res, next){
                if(req.query.skip)
                    return next();
                let html = fs.readFileSync (process.env.FRONTEND_DIR + '/index.html', 'utf-8');
                res.end (html);
            };
            app.get ('*', handle);

            app.get ('*', function skippedOnly(req, res){
                res.end ('skipped');
            });

            console.log (`[OK] Server is running on localhost:${app.get ('port')}`);
            console.log (`Apollo Server ready at http://localhost:${app.get ('port')}${apolloServer.graphqlPath}`);
            console.log (`Subscriptions ready at ws://localhost:${app.get ('port')}${apolloServer.subscriptionsPath}`)
            resolve (app);
        });

        server.setTimeout(10*60*1000);

    });
//},{count: 2});
})