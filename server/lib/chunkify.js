const babelCore = require("@babel/core")
const babelParser = require("@babel/parser");

function transpile(expression){
    let tokens = babelParser.parse(expression, {
        sourceType: "module",
        plugins: [
            ['decorators', { decoratorsBeforeExport: false }]
        ],
        allowReturnOutsideFunction:true,
    });

    var data = babelCore.transformFromAstSync(tokens, expression, {
        "presets": [
            ["@babel/preset-env", {
                targets: {
                    browsers: '> 0.25%, not dead'
                }
            }]
        ],
        "plugins": [
            //"@babel/plugin-transform-modules-umd",
            "@babel/plugin-transform-runtime",
            ["@babel/plugin-syntax-dynamic-import"],
            ["@babel/plugin-proposal-optional-chaining"],
            ["@babel/plugin-proposal-decorators", {
                "legacy": true
            }],

        ],
        compact: false,
        comments: true,
        "sourceMaps": false,
        "retainLines": true
    });
    let code = data.code;
    code = code.replace('Object.defineProperty(exports, "__esModule", { value: true });','')
    return code;//{ code, map, ast }
}

function chunkify(expression,chunkName = 'chunk') {
    return `((typeof self !== 'undefined' ? self : this)["webpackJsonp"] = (typeof self !== 'undefined' ? self : this)["webpackJsonp"] || []).push([["${chunkName}"],{

"/${chunkName}.js":
    (function(module, exports, __webpack_require__) {

${expression}

/***/ })

}]);
    `;
}

export {
    chunkify,transpile
}

