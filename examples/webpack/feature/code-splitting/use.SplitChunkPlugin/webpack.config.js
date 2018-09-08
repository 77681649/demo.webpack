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
	// devtool: 'cheap-source-map',
	output: {
		path: path.join(__dirname, './dist'),
		filename: '[name].[hash:8].js',
	},
	mode: 'development',
	plugins: [new CleanWebpackPlugin('./dist')],
	optimization: {
		splitChunks: {
			chunks: 'all',
			minSize: 0,
			cacheGroups: {
				vendors: {
					test: /node_module/,
					minChunks: 1,
					name: 'vendor',
				},
				common: {
					minChunks: 2,
					name: 'common',
				},
				default: false,
			},
		},
		runtimeChunk: {
			name: 'manifest',
		},
	},
};
