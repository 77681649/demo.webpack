//
// entry: 使用多入口实现代码分离
//
const path = require('path');
module.exports = {
	context: path.join(__dirname, './src'),
	entry: {
		'main.bundle': './index',
		'1.bundle': './1',
		'2.bundle': './2',
	},
	devtool: 'cheap-source-map',
	output: {
		path: path.join(__dirname, './dist'),
	},
	mode: 'development'
};
