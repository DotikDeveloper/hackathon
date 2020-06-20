import express from "express";
import _ from 'underscore';
import CustomRoutes from "../models/CustomRoutes";
import {errorString} from "../../../server/lib/utils";

var {createDefaultCompiler, assemble} = require ('@vue/component-compiler');
const router = express.Router ();
import customQueryParse from "/server/lib/customQueryParse";
import forUser from "../../vmrunner/forUser";
import sift from 'sift';
import NavItems from "../models/NavItems";

const babelCore = require ("@babel/core")
const babelParser = require ("@babel/parser");

const transform = function (expr) {
    var data = babelCore.transformSync (expr, {
        babelrc: false,
        configFile: false,
        sourceType: 'module',
        "presets": [
            ["@babel/preset-env", {
                //"modules": false,
                targets: {
                    browsers: '> 0.25%, not dead'
                }
            }]
        ],
        "plugins": [
            ["@babel/plugin-syntax-dynamic-import"],
            ["@babel/plugin-proposal-optional-chaining"],
            ["@babel/plugin-proposal-decorators", {
                "legacy": true
            }],
            ["transform-es2015-modules-commonjs-simple", {
                "noMangle": true
            }]
        ],
        "sourceMaps": false,
        "retainLines": true

    });

    return data.code;
}

function createVueCompiler (options) {
    const compiler = createDefaultCompiler (options);
    return {
        transform (fileName, content) {
            const descriptor = compiler.compileToDescriptor (fileName, content);
            return assemble (compiler, fileName, descriptor, {styleInjector: 'function(){}'});
        },
    };
}

let vueCompiler = null;

async function compileVueTemplate (content, fileName='Test.vue', isModule = false) {
    const options = {
        template: {
            compilerOptions: {
                whitespace: 'condense',
            },
            isProduction: process.env.NODE_ENV === 'production'
        },
    };
    if (!vueCompiler) {
        vueCompiler = createVueCompiler (options);
    }
    const {code} = vueCompiler.transform (fileName, content);
    return code;
}

/**
 * @param {CustomRoutes} customRoute
 * @param {Users} user
 * */
async function filterRoute (customRoute, user) {
    const ctx = {
        user: user,
        user_id: customRoute.user_id
    };
    let vmRunner = forUser (customRoute.user);
    try {
        let condition = await customQueryParse (customRoute.rules, ctx, vmRunner);
        let query = sift (condition);
        let result = query (ctx);
        if (result)
            return true;
    } catch (err) {
        return false;
    }
}

router.get('/navTree.js',async (req,res)=>{
    res.set ('Content-Type', 'application/javascript;charset=UTF-8');
    res.set ('Accept-Ranges', 'bytes');
    let treeData = await NavItems.generateTreeData(req.user);
    res.send (`export default ${JSON.stringify(treeData)};`);
});

router.get ('/customRoutes.js', async function (req, res) {
    try {
        res.set ('Content-Type', 'application/javascript;charset=UTF-8');
        res.set ('Accept-Ranges', 'bytes');

        /**@type CustomRoutes[]*/
        let customRoutes = await CustomRoutes.find ({}).populate ('user');

        let filteredRoutes = await _.mapAsync (customRoutes, /**@param {CustomRoutes} customRoute*/async (customRoute) => {
            try {
                if (await filterRoute (customRoute, req.user))
                    return customRoute;
            } catch (err) {
                return null;
            }
        });
        filteredRoutes = _.compact (filteredRoutes);
        let $code = [];
        $code.push (`
        function require(chunkName){
            return __webpack_require__.e(chunkName)
            .then(__webpack_require__.t.bind(null, chunkName, 7))
            .then(function(module){
                return module.default;
            });
        }
        var routes = []; var tmpRoute = null;
        `);

        _.each (filteredRoutes, /**@param {CustomRoutes} customRoute*/ (customRoute) => {
            if (customRoute.route) {
                $code.push (`tmpRoute = ${customRoute.route};`);
                $code.push (`
                tmpRoute.component = function(resolve){
                    require('./customRoutes/component.js?id=${customRoute.id}')
                    .then( resolve );
                };
                routes.push( tmpRoute );
                `);
            }
        });


        $code = transform ($code.join ('\n')) + '\nexport default routes;';
        res.send ($code);
    } catch (err) {
        console.error (err);
        res.status (500).send (errorString (err));
    }
});

router.get ('/customRoutes/component.js', async (req, res) => {
    try {
        let id = req.query.id;
        console.log(JSON.stringify({id}));
        if (!id)
            return res.status (404).send ('Not found:(');
        id = id.replace('.js','');
        res.set ('Content-Type', 'application/javascript;charset=UTF-8');
        res.set ('Accept-Ranges', 'bytes');
        /**@type CustomRoutes*/
        let customRoute = await CustomRoutes.findOne ({_id:id}).populate ('user');
        if (await filterRoute (customRoute, req.user)) {
            let code = transform (await compileVueTemplate (customRoute.vueTemplate,`${customRoute.name}.vue`));
            let chunk = `((typeof self !== 'undefined' ? self : this)["webpackJsonp"] = (typeof self !== 'undefined' ? self : this)["webpackJsonp"] || []).push([
            
            ["./customRoutes/component.js?id=${customRoute.id}"],
            
            {

                "./customRoutes/component.js?id=${customRoute.id}":
                    (function(module, exports, __webpack_require__) {
                
                ${code}
                
                })
                
                }]);`;
            res.send (chunk);
        }

    } catch (err) {
        console.error (err);
        res.status (500).send (errorString (err));
    }
});

export default router;