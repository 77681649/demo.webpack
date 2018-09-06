//
// entry: 多入口
//
// Asset      Size  Chunks             Chunk Names
// 1.js  3.77 KiB       1  [emitted]  1
// 2.js  3.77 KiB       2  [emitted]  2
// main.js   4.3 KiB    main  [emitted]  main
// 1.js.map  3.63 KiB       1  [emitted]  1
// 2.js.map  3.63 KiB       2  [emitted]  2
// main.js.map  3.87 KiB    main  [emitted]  main
//
// [./1.js] 67 bytes {1} {main} [built]
// [./2.js] 67 bytes {2} {main} [built]
// [./index.js] 64 bytes {main} [built]
//

const path = require("path");

module.exports = {
  context: path.join(__dirname, "src"),
  entry: {
    "1": "./1.js",
    "2": "./2.js",
    main: "./index.js"
  },
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "./dist")
  },
  mode: "development"
};
