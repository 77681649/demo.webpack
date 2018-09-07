//
// entry: 使用多入口实现代码分离
//
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
	context: path.join(__dirname, './src'),
	entry: {
		app: './app',
		home: './home',
		list: './list',
	},
	devtool: 'cheap-source-map',
	output: {
		path: path.join(__dirname, './dist'),
		filename: '[name].[hash:8].js',
	},
	mode: 'development',
	plugins: [new CleanWebpackPlugin('./dist')],
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
		runtimeChunk: {
			name: 'manifest',
		},
	},
};
