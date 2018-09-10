//
// module.rules
// 1. 使用babel
// 2. noParse 过滤 jquery
//
const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Config = require("webpack-chain");

const context = path.join(__dirname, "src");
const output = path.join(__dirname, "dist");

const config = new Config();

// prettier-ignore
module.exports = config
  .context(context)
  .entry('main').add('./index').end()
  .devtool('source-map')
  .devServer
    .contentBase(path.join(__dirname,'assets'))
    .end()
  .output
    .path(output)
    .end()
  .mode('development')
  .module
    .rule('compile')
      .test(/\.jsx?$/)
      .use('babel')
        .loader('babel-loader')
        .options({
          presets: [
            "@babel/preset-env"
          ],
          babelrc:false,
          cacheDirectory:true
        })
        .end()
      .end()
    .end()
  .plugin('clean-webpack-plugin').use(CleanWebpackPlugin,output).end()
  .plugin('html-webpack-plugin').use(HtmlWebpackPlugin).end()
  .toConfig();
