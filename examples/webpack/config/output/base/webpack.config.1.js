//
// output: 指定输出文件的名称为 static.[chunk].js
// Asset      Size  Chunks             Chunk Names
// scripts/static.1.js  3.78 KiB       1  [emitted]  1
// scripts/static.2.js  3.78 KiB       2  [emitted]  2
// scripts/static.main.js   4.3 KiB    main  [emitted]  main
// scripts/static.1.js.map  3.64 KiB       1  [emitted]  1
// scripts/static.2.js.map  3.64 KiB       2  [emitted]  2
// scripts/static.main.js.map  3.88 KiB    main  [emitted]  main
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
    path: path.join(__dirname, "./dist"),
    filename: "scripts/static.[name].js"
  },
  mode: "development"
};
