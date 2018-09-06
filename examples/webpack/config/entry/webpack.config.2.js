//
// entry: 单入口 && 多模块
//
// Asset      Size  Chunks             Chunk Names
// main.js  4.29 KiB    main  [emitted]  main
// main.js.map  3.74 KiB    main  [emitted]  main
// [./1.js] 67 bytes {main} [built]
// [./2.js] 67 bytes {main} [built]
// [0] multi ./1.js ./2.js 40 bytes {main} [built]
//

const path = require("path");

module.exports = {
  context: path.join(__dirname, "src"),
  entry: ["./1.js", "./2.js"],
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "./dist")
  },
  mode: "development"
};
