const Config = require('webpack-chain');
const config = new Config();

config
	.entry('index')
	.add('src/index.js')
	.end();

console.log(JSON.stringify(config.toConfig(), null, 2));
