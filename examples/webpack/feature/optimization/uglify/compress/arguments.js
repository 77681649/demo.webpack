const UglifyJS = require("uglify-js");

var code = {
  "file1.js": `
  function add(first, second) { 
    return arguments[0] + arguments[1]; 
  }
`
};

var options = {
  toplevel: false,
  compress: {
    arguments: true
  }
};

var result = UglifyJS.minify(code, options);

console.log(result.code);
