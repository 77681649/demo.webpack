//
// entry: 单入口 && 动态模块
//
// Asset      Size  Chunks             Chunk Names
// main.js   4.3 KiB    main  [emitted]  main
// main.js.map  3.87 KiB    main  [emitted]  main
// [./1.js] 67 bytes {main} [built]
// [./2.js] 67 bytes {main} [built]
// [./index.js] 64 bytes {main} [built]
//

const path = require("path");

module.exports = {
  context: path.join(__dirname, "src"),
  entry: () => {
    return new Promise(resolve => {
      resolve("./index.js");
    });
  },
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "./dist")
  },
  mode: "development"
};
