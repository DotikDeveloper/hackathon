var plugins = [
    '@babel/plugin-transform-runtime',
    ['@babel/plugin-syntax-dynamic-import'],
];
console.log(`Version: ${process.version}`);
if (process.env.SERVER!=='1') {
    plugins.push(["transform-es2015-modules-commonjs-simple", {
        "noMangle": true
    }]);
}
var arr = [
    [
        "babel-plugin-root-import",
        {
            "rootPathSuffix": "./",
            "rootPathPrefix": "/"
        }
    ],
    [
        "@babel/plugin-proposal-decorators",
        {
            "legacy": true
        }
    ],
    ["@babel/plugin-proposal-optional-chaining"],
    ["@babel/plugin-proposal-class-properties", {"loose": true}]
];
for(var i=0;i<arr.length;i++){
    plugins.push(arr[i]);
}
if (process.env.SERVER!=='1') {
    plugins.push ('@babel/plugin-transform-modules-commonjs');
    plugins.push ('import-graphql');
    /*plugins.push(["transform-es2015-modules-commonjs-simple", {
        "noMangle": true
    }]);*/
} else {
    plugins.push ('babel-plugin-graphql-import');
    //plugins.push ('add-module-exports');
}

module.exports = {
    "presets": [
        [
            "@babel/preset-env"
        ]
    ],
    plugins: plugins,
    exclude: [],
    "sourceMaps": "inline",
    "retainLines": true,
    "compact": false
};
