const merge = require('webpack-merge')

const commonConfig = {
  entry: ['main'],
  module: {
    rules: [
      {
        use: "babel-loader"
      }
    ]
  }
}

const devConfig = {
  entry: ['vendor'],
  module: {
    rules: [
      {
        use: "react-hmr-loader"
      }
    ]
  }
}


const output = merge.strategy(
  {
    'entry': 'append'
  }
)(commonConfig, devConfig)

console.log(JSON.stringify(output, null, 2))