const merge = require('webpack-merge')

const commonConfig = {
  entry: 'main',
  module: {
    rules: [
      {
        use: "babel-loader"
      }
    ]
  }
}

const devConfig = {
  module: {
    rules: [
      {
        use: "react-hmr-loader"
      }
    ]
  }
}

const customizeArray = (a, b, key) => {
  if (key === 'rules') {
    return [...a, ...b]
  }

  return undefined
}
const output = merge({ customizeArray })(commonConfig, devConfig)

console.log(JSON.stringify(output, null, 2))