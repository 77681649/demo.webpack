/**
 * compile es6
 * 1. 使用babel-loader compile ES6 && JSX
 * 2. 使用splitChunk && runtimeChunk 拆分代码
 * 3. 使用babel-syntax-dynamic-import 动态加载
 * 4. 使用babel-plugin-transform-runtime 减少编译出的冗余代码
 * 5. 使用babel-polyfill polyfill API
 * 6. 使用less/css/style-loader 编译less
 */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const Config = require('webpack-chain');

const context = path.join(__dirname, 'src');
const output = path.join(__dirname, 'dist');

const config = new Config();

// prettier-ignore
module.exports = config
  .context(context)
  .entry('server')
    .add('./server')
    .end()
  .devtool('source-map')
  .target('node')
  .externals([nodeExternals({
    modulesDir: '../../../../node_modules'
  })])   // exclude node_modules
  .output
    .path(output)
    .chunkFilename('scripts/[name].async.js')
    .libraryTarget('commonjs2')
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
    .rule('compile-js')
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
    // ignore-style
    .rule('ignore-style')
      .test([/\.less/, /\.css/])
      .use('ignore').loader('ignore-loader').end()
      .end()
    // ejs
    .rule('ejs')
      .test(/\.ejs/)
      .use('ejs').loader('ejs-loader').end()
      .end()
    .end()
  .plugin('clean-webpack-plugin').use(CleanWebpackPlugin,[output]).end()
  .toConfig();

console.log(JSON.stringify(module.exports, null, 2));
