/**
 * compile es6
 */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Config = require('webpack-chain');

const context = path.join(__dirname, 'src');
const output = path.join(__dirname, 'dist');

const config = new Config();

// prettier-ignore
module.exports = config
  .context(context)
  .entry('main').add('./index').end()
  .devtool('source-map')
  .devServer
    .open(true)
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
    .rule('compile')
      .test(/\.jsx?$/)
      .exclude.add(/node_modules/).end()
      .use('babel')
        .loader('babel-loader')
        .options({
          presets: [
            "@babel/preset-env",    // compile es6
            "@babel/preset-react"   // compile jsx
          ],
          plugins:[
            "@babel/plugin-syntax-dynamic-import"   // compile import()
          ],
          babelrc: false,
          cacheDirectory: false
        })
        .end()
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
  .toConfig();
