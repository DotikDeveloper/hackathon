const HtmlBeautifyPlugin = require('html-beautify-webpack-plugin');
const webpack = require('webpack');
const Visualizer = require('webpack-visualizer-plugin');
const path = require('path');

module.exports = {
    publicPath: process.env.BASE_URL,
    chainWebpack: config => {
        config.module
        .rule('images')
        .use('url-loader')
        .loader('url-loader')
        .tap(options => Object.assign(options, { limit: 10240 }))
/*
        config.resolve.alias
            .set('menuDataSchemas', path.resolve(__dirname, 'menuDataSchemas.js'));
*/
        //if (process.env.NODE_ENV === 'production') {
         //   config.module.rule('vue').uses.delete('cache-loader');
         //   config.module.rule('js').uses.delete('cache-loader');
         //   config.module.rule('ts').uses.delete('cache-loader');
         //   config.module.rule('tsx').uses.delete('cache-loader');
          //  config.performance.set('hints',false);
        //}
    },
    configureWebpack: {
        devtool: 'source-map',
        plugins: [
            new HtmlBeautifyPlugin({
                config: {
                    html: {
                        end_with_newline: true,
                        indent_size: 2,
                        indent_with_tabs: true,
                        indent_inner_html: true,
                        preserve_newlines: true,
                        unformatted: ['p', 'i', 'b', 'span']
                    }
                },
                replace: [ ' type="text/javascript"' ]
            }),
            new webpack.DefinePlugin({
                'process.env.ROOT_URL':JSON.stringify( process.env.ROOT_URL || 'http://localhost:3000' ),
            }),
            new Visualizer({ filename: './statistics.html' }),
           // new webpack.SourceMapDevToolPlugin({})
        ]
    },
    filenameHashing: false,
    pages: {
        main: {
            entry: 'client/main.js',
            filename: 'index.html'
        }
    },
    runtimeCompiler:true,
    outputDir:`dist/${process.env.BUILD_MODE}/client`
}
/*
module.exports = {
    configureWebpack: {
        performance: {
            hints:false
        },
        plugins: [],
    }
}*/