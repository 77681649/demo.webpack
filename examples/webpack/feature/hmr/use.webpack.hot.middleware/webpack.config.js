/**
 * 使用happypack
 */
const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HappyPack = require("happypack");
const HotModuleReplacementPlugin = require("webpack/lib/HotModuleReplacementPlugin");
const Config = require("webpack-chain");

const context = path.join(__dirname, "src");
const output = path.join(__dirname, "dist");

const config = new Config();

// prettier-ignore
module.exports = config
  .context(context)
  .entry('main')
    // 2. add HMR客户端代理
    .add('webpack-hot-middleware/client')
    .add('./index')
    .end()
  .devtool('source-map')
  .devServer
    .open(true)
    .historyApiFallback(true)
    .end()
  .output
    .path(output)
    .chunkFilename('scripts/[name].async.js')
    .end()
  .mode('development')
  .resolve
    .extensions
      .add(".js")
      .add(".jsx")
      .add(".json")
      .end()
    .end()
  .module
    .noParse([/react\.js$/,/react-dom\.js$/])
    // 将es6 compile 托管给 happypack 实例: babel
    .rule('compile')
      .test(/\.jsx?$/)
      .exclude.add(/node_modules/).end()
      .use('happypack-laoder').loader('happypack/loader').options({id: 'babel'}).end()
      .end()
    .end()
  .optimization
    .splitChunks({
      chunks: "all",
      minSize: 0,
      cacheGroups: {
        // 将node_module 提取到 vendor
        "vendors":{
          name: 'vendor',
          test: /node_module/,
          minChunks: 1,
          // priority: -10
        },
        "common": {
          name: "common",
          minChunks: 2,
          // priority: -20
        },
        "default": false
      }
    })
    .runtimeChunk({
      name: 'scripts/runtime'
    })
    .end()
  .plugin('clean-webpack-plugin').use(CleanWebpackPlugin,[output]).end()
  .plugin('html-webpack-plugin').use(HtmlWebpackPlugin,[{
    template:'../index.html'
  }]).end()
  // 1. 加入webpack.HotModuleRelacementPlugin  - 为了支持模块热替换，生成 .hot-update.json 文件
  .plugin('hot-module-replacement').use(HotModuleReplacementPlugin).end()
  // 创建HappyPack实例
  .plugin('babel-happypack').use(HappyPack,[{
    id: 'babel',
    loaders: [{
      loader: 'babel-loader',
      options:{
        presets: [
          ["@babel/preset-env", { useBuiltIns: false } ],    // compile es6
          "@babel/preset-react"   // compile jsx
        ],
        plugins:[
          "@babel/plugin-syntax-dynamic-import",   // compile import()
          [ "@babel/plugin-transform-runtime", {
            regenerator:true
          } ]        // reduce compiled code
        ],
        babelrc: false,
        cacheDirectory: false
      }
    }]
  }]).end()
  .toConfig();
