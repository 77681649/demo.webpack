const express = require("express");
const webpack = require("webpack");
const webpackConfig = require("./webpack.config");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddlware = require("webpack-hot-middleware");

const compiler = webpack(webpackConfig);

const app = new express();

app.use(
  webpackDevMiddleware(compiler, {
    // 3. 启动HMR
    hot: true
  })
);

// 4. 为了支持模块热替换，响应用于替换老模块的资源
app.use(webpackHotMiddlware(compiler));

app.use(express.static("./dist"));

app.listen(8080, () => "starting server: http://localhost:8080");
