const rootPath = require('path').join(__dirname, '..');

require("@babel/polyfill" );
require('@babel/register')({
    root: rootPath, // This tells babel where to look for `babel.config.js` file
    //ignore: [],
    ignore: [/node_modules/],
    //only: [rootPath],
});
process.on('uncaughtException', (err, origin) => {
    console.log('uncaughtException');
    console.error(err);
    console.error(origin);
});

process.on('unhandledRejection',  (err)=>{
    console.log('unhandledRejection');
    console.error(err);
    console.log(err.stack);
});

require('../lib/underscore.mixins.server');

module.exports = require("./load/entrypoint.js");