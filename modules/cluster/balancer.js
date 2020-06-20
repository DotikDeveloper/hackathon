import {get as safeGet} from 'lodash';
import Users from "../account/Users";
import Servers from "./models/Servers";
import http from 'http';
import https from 'https';
import HttpClient from "../../server/lib/HttpClient";

function rawToObject(rawHeaders) {
    let headers = {};
    for (let i = 0; i < rawHeaders.length; i++) {
        if (i % 2 == 0) {
            let key = rawHeaders[i];
            if (key)
                headers[rawHeaders[i]] = rawHeaders[i + 1];
        }
    }
    return headers;
}

export default function balancer(req, res, next){
    let rawUser = safeGet(req,'session.user',null);
    if(!rawUser){
        return next();
    }
    Users.findOne({_id:rawUser._id})
    .populate('currentUser')
    .populate('server')
    .populate('node')
    .populate('nodeInstances')
    .then(/**@param {UsersDoc} user*/async (user)=>{
        /**@type {Users}*/
        let currentUser = null;
        if(user.currentUser){
            currentUser = user.currentUser;
            await currentUser
                .populate('currentUser')
                .populate('server')
                .populate('node')
                .populate('nodeInstances')
                .execPopulate();
        }else{
            currentUser = user;
        }
        if(!currentUser||!currentUser.server)
            return next();
        let userNode = currentUser.node;
        if(!userNode)
            return next();
        let server = Servers.current;
        if(!server)
            return next();
        let currentInstance = Servers.nodeInstance;

        if(!currentInstance||!currentUser.nodeInstance)
            return next();

        if(
            currentInstance.id === currentUser.nodeInstance.id
        ){
            return next();
        }

        let targetUrlData = HttpClient.urlParser.parse(currentUser.nodeInstance.base_url);

        let targetPort = null;
        if(targetUrlData.protocol==='https:'){
            targetPort = Number(targetUrlData.port||443);
        }else{
            targetPort = Number(targetUrlData.port||80);
        }

        const options = {
            method: req.method,
            path: req.path,
            headers: req.originalHeaders,
            port : targetPort,
            hostname : targetUrlData.hostname,
            host : targetUrlData.host,
            agent:false,
            //pool:HttpClient.npmRequestPool,
            followRedirect:false
        };
        let requestModule = targetUrlData.protocol === 'https:'?https:http;
        const gatewayRequest = requestModule.request(options,function (upstreamResponse) {
            const headers = rawToObject(upstreamResponse.rawHeaders);
            res.writeHead(upstreamResponse.statusCode||503, headers);
            upstreamResponse.pipe(res,{end:true});
        });
        res.once('error',function(){
            gatewayRequest.abort();
        });
        gatewayRequest.setTimeout(30000,function(){
            gatewayRequest.abort();
        });
        gatewayRequest.once('abort',function(){
            res.end();
        });
        req
        /*.pipe(new  Transform({
            writableObjectMode:false,
            readableObjectMode:false,
            transform(buffer, encoding, callback){
                console.log('res:',buffer.toString());
                return callback(null,buffer)
            }
        }))*/
        .pipe(gatewayRequest, {end:true});
        gatewayRequest.on('error', function (e) {
            console.log(e);
            res.end();
        });
    });
}