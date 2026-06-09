const fs = require('fs')
const path = require('path')

const BannerPlugin = require('./webpack_plugins/BannerPlugin')
const DefinePlugin = require('webpack').DefinePlugin
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const WebpackObfuscator = require('webpack-obfuscator')

const timestamp = + Date.now()


let config = {
    mode: 'development',
    entry: {
        yukon: './src/Game.js'
    },
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[id].bundle.js',
        path: path.resolve(__dirname, 'assets/scripts/client')
    },
    optimization : {
        minimize: false
    },
    devServer: {
        static: {
            directory: path.resolve(__dirname),
            publicPath: '/',
            watch: false
        },
        devMiddleware: {
            writeToDisk: true
        },
        proxy: [
            {
                context: '/world/login',
                target: 'http://localhost:6111',
                pathRewrite: { '^/world/login': '' },
                ws: true
            },
            {
                context: '/world/blizzard',
                target: 'http://localhost:6112',
                pathRewrite: { '^/world/blizzard': '' },
                ws: true
            },
            {
                context: '/create/scripts/php',
                target: 'http://localhost:80',
            }
        ],
        client: {
            overlay: false
        },
        host: 'localhost',
        port: 8080,
        hot: false
    },
    resolve: {
        alias: {
            '@engine': path.resolve(__dirname, 'src/engine'),
            '@scenes': path.resolve(__dirname, 'src/scenes'),
            '@components': path.resolve(__dirname, 'src/scenes/components'),
            '@igloos': path.resolve(__dirname, 'src/scenes/igloos')
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new DefinePlugin({
            VERSION: JSON.stringify(require('./package.json').version),
            TIMESTAMP: timestamp
        })
    ]
}

module.exports = (env, argv) => {
    if (argv.mode !== 'production') {
        // Dev server: serve the real CPL page (index.ejs) and the bundle at the SAME asset paths the
        // prod template references, so `npm run dev` previews exactly what ships (not the stale base
        // index.html). Generated files (index.html, bundle) are served from memory (writeToDisk:false)
        // so the repo isn't polluted; the source assets/ (media, fonts, lib scripts) come from
        // devServer.static (repo root). World sockets proxy to a local backend (see devServer.proxy);
        // with no local server they simply won't connect, which is fine for frontend/layout work.
        config.output = {
            filename: 'assets/scripts/client/[name].bundle.min.js',
            chunkFilename: 'assets/scripts/client/[id].bundle.min.js',
            path: path.resolve(__dirname, 'dist'),
        }
        config.devServer.devMiddleware.writeToDisk = false
        config.plugins.push(
            new HtmlWebpackPlugin({
                filename: 'index.html',
                inject: false,
                template: 'index.ejs',
                templateParameters: { timestamp: timestamp }
            })
        )
        return config
    }

    config.output = {
        filename: 'assets/scripts/client/[name].bundle.min.js',
        chunkFilename: 'assets/scripts/client/[id].[contenthash].bundle.min.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    }

    config.optimization.minimize = true
    config.optimization.minimizer = [
        new TerserPlugin({
            extractComments: false
        })
    ]

    config.plugins.push(
        new HtmlWebpackPlugin({
            filename: 'index.html',
            inject: false,
            template: 'index.ejs',
            templateParameters: {
                timestamp: timestamp
            }
        }),
        // MIT License do not remove
        new BannerPlugin({
            banner: fs.readFileSync('./LICENSE', 'utf-8')
        })
    )

    if (env.obfuscate === 'true') {
        config.plugins.push(
            new WebpackObfuscator({
                rotateStringArray: true,
                reservedStrings: ['\s*']
            }, [])
        )
    }

    return config
}
