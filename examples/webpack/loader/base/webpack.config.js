const path = require('path');
const Config = require('webpack-chain');
const config = new Config();

// prettier-ignore
module.exports = config
  .entry('main')
    .add('./src/index')
    .end()
  .mode('development')
  .output
    .path(path.join(__dirname,'./dist'))
    .end()
  .module
    .rule('example')
      .test(/\.js$/)
      .use('example-loader').loader('./loader/example-loader?v=1').end()
      .end()
    .end()
  .toConfig()
