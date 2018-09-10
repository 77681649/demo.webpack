//
// output.library: 导出为var
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
  .entry('react').add('./react').end()
  .devtool('source-map')
  .output
    .path(output)
    .library('react')
    .libraryTarget('commonjs')
    .end()
  .mode('development')
  .plugin('clean-webpack-plugin').use(CleanWebpackPlugin,output).end()
  .plugin('html-webpack-plugin').use(HtmlWebpackPlugin).end()
  .toConfig();
