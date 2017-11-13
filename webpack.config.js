/**
 * Created by trump on 2017/3/14.
 */
/* eslint-disable */
'use strict';

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const _ = require('lodash');
const execSync = require('child_process').execSync;
const VERSION_HASH = execSync(`git rev-parse --short --hash HEAD`).toString();

console.log('Git Hash ID', VERSION_HASH);

const CLIENT_DIR = __dirname;

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const MainJsFileName = 'main.js';
let CLIENT_SRC_DIR = path.resolve(CLIENT_DIR, 'src');

const appNameList = glob.sync(`*_app/${MainJsFileName}`, {
    cwd: CLIENT_SRC_DIR
}).map(f => f.split('/')[0].replace('_app', ''));

let appChunkNameMaps = {};
let appPageChunkNameMaps = {};
let pageEntries = {};

appNameList.forEach(appName => {
    let APP_DIR = path.resolve(CLIENT_SRC_DIR, `${appName}_app`);
    let pageList =  glob.sync(`pages/**/*Page.js`, {
        cwd: APP_DIR
    });
    appPageChunkNameMaps[appName] = [];
    let pageIndexFileContentArr = [
        '/** Please dont update this file.*/',
        'export const pageLoader = {};'
    ];
    pageList.forEach(pageFileName=> {
        let pageName = pageFileName.replace(/^pages(\\|\/)/, '').replace(/\.js$/, '');
        let pageMethodName = _.upperFirst(pageName.replace(/\\|\//g, ''));
        
        pageIndexFileContentArr.push(`export const get${pageMethodName} = pageLoader.get${pageMethodName}= ()=> import("./${pageName}" /* webpackChunkName: "${appName}/pages/${pageName}" */).then(mod=> mod["default"]);`);
        let pageChunkName = `${appName}/${pageFileName}`.replace(/\.js$/,'');
        appPageChunkNameMaps[appName].push(pageChunkName);
        pageEntries[ pageChunkName ] = `./src/${appName}_app/${pageFileName}`;
        
    });
    pageIndexFileContentArr.push('export const getPageByName = (name)=> pageLoader["get"+name]();');
    fs.writeFileSync(path.resolve(APP_DIR, 'pages/index.js'), pageIndexFileContentArr.join('\n\n'), 'utf8');
    
});

let appEntries = (function () {
    let entries = {};
    appNameList.forEach(app => {
        let appChunkName = `${app}/main`;
        appChunkNameMaps[app] = appChunkName;
        entries[appChunkName] = `./src/${app}_app/main.js`;
    });
    return entries;
})();

const isProductionMode = process.env.NODE_ENV === 'production';

let devJsList = [];

if (!isProductionMode && process.env.USE_PROXY) {
    devJsList.push('/webpack-dev-server.js')
}

let publicPath = "/build/";

let entry = _.assign({}, appEntries);

module.exports = {
    entry
    , devtool: 'source-map'
    , output: {
        path: path.resolve(CLIENT_DIR, 'build')
        , filename: '[name].js'
        , chunkFilename: `[name].js`
        , sourceMapFilename: '[file].map'
        , pathinfo: true
        , publicPath: publicPath
    }
    , module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015', "stage-0", "react"],
                        plugins: [
                            "transform-class-properties",
                            "transform-decorators-legacy",
                            ["import", { "libraryName": "antd" }]
                        ]
                    }
                }
            },
            {
                test: /\.less$/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "less-loader" // compiles Less to CSS
                }]
            },
            {
                test: /\.scss$/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "sass-loader" // compiles Sass to CSS
                }]
            },
            {
                test: /\.css/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }]
            }
        ]
    }
    , plugins: function () {
        
        let plugins = [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                },
            })
        ];
        
        if (isProductionMode) {
            plugins.push(new webpack.optimize.UglifyJsPlugin());
        }
        
        _.forEach(appNameList, appName=> {
            let appChunkName = appChunkNameMaps[appName];
            let appPageChunkNames = appChunkNameMaps[appName];
            plugins.push(
                new webpack.optimize.CommonsChunkPlugin({
                    name: `${appName}/common`,
                    chunks: [appChunkName].concat(appPageChunkNames)
                })
            );
        });
        
        let htmlPlugins = function () {
            let plugins = [];
            
            appNameList.forEach(appName => {
                let preLoadJsList = [
                    `/${appName}/common.js`,
                    `/${appName}/main.js`
                ];
                
                let homePageChunkName = `/${appName}/pages/HomePage`;
                if(appPageChunkNameMaps[appName].indexOf()) {
                    preLoadJsList.push(`${homePageChunkName}.js`);
                }
                
                let jsFiles = devJsList.concat(preLoadJsList.map(f => `/build${f}?v=${VERSION_HASH}`)).map(f=> f.replace(/\s/g, ''));
                plugins.push(new HtmlWebpackPlugin({
                    filename: `${appName}/index.html`,
                    template: 'src/core/index.ejs',
                    inject: false,
                    js: jsFiles,
                    title: '',
                    serverPath: ''
                }));
            });
            
            return plugins;
        }();
        
        plugins = plugins.concat(htmlPlugins);
        
        return plugins;
    }()
    , devServer: {
        hot: true,
        inline: true,
        port: 7888,
        compress: true,
        watchOptions: {
            aggregateTimeout: 100,
            poll: 300
        },
    }
};