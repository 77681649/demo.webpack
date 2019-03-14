const UglifyJS = require("uglify-js");

var code = {
  "file1.js": `

  var code = 1;
  var visible = !!code ? 'yes' : 'no'

`
};

var options = {
  toplevel: false,
  compress: {
    booleans: true
  }
};

var result = UglifyJS.minify(code, options);

console.log(result.code);
