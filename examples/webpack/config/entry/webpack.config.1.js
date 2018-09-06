//
// entry: 单入口 && 单模块
//
// Asset      Size  Chunks             Chunk Names
// main.js  4.49 KiB    main  [emitted]  main
// [./src/1.js] 67 bytes {main} [built]
// [./src/2.js] 67 bytes {main} [built]
// [./src/index.js] 64 bytes {main} [built]
//

const path = require("path");

module.exports = {
  entry: "./src/index.js",
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "./dist")
  },
  mode: "development"
};
