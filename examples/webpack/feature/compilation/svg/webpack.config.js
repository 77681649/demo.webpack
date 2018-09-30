/**
 * compile es6
 * 
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
  .entry('main')
    // .add('@babel/polyfill')
    .add('./pages/index')
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
    .rule('svg')
      .test(/\.svg?$/)
      .use('file-loader')
        .loader('file-loader')
        .end()
    .end()
    .rule('compile')
      .test(/\.jsx?$/)
      .exclude.add(/node_modules/).end()
      .use('babel')
        .loader('babel-loader')
        .options({
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
        })
        .end()
      .end()
    .end()

  .plugin('clean-webpack-plugin').use(CleanWebpackPlugin,[output]).end()
  .plugin('html-webpack-plugin').use(HtmlWebpackPlugin,[{
    template:'../index.html'
  }]).end()
  .toConfig();
