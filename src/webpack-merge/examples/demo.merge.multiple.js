var merge = require('webpack-merge')
var path = require('path');
var baseConfig = {
  server: {
    target: 'node',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'lib.node.js'
    }
  },
  client: {
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'lib.js'
    }
  }
};

// specialized configuration
var production = {
  client: {
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[hash].js'
    }
  }
}

const output = merge.multiple(baseConfig, production)

console.log(JSON.stringify(output, null, 2))