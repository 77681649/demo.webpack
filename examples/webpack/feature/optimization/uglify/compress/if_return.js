const UglifyJS = require("uglify-js");

var code = {
  "file1.js": `
  for(var i = 0;i < 10;i++) {
    if(i == 9) return
    if(i == 0) continue

    console.log(i)
  }
`
};

var options = {
  toplevel: false,
  compress: {
    if_return: false
  }
};

var result = UglifyJS.minify(code, options);

console.log(result.code);
