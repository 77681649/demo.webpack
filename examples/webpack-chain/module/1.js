const Config = require('webpack-chain');
const config = new Config();

config.module
	.rule('index')
	.pre()
	.use('aaa');

console.log(JSON.stringify(config.toConfig(), null, 2));
