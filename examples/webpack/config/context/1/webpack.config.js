const path = require("path");

module.exports = {
  context: path.join(__dirname, "./src"),
  // entry 路径 = path.join(context, entry)
  entry: "./index.js",
  output: {
    path: path.join(__dirname, "./dist")
  },
  mode: "development",
  devtool: "source-map"
  // module: {
  //   rules: [
  //     {
  //       loader: "./loader/test-loader",
  //       test: /\.js$/
  //     }
  //   ]
  // }
};
