//
// output: 使用publicPath指定deamon
//

const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	context: path.join(__dirname, 'src'),
	entry: {
		main: './index.js',
	},
	devtool: 'source-map',
	output: {
		path: path.join(__dirname, './dist'),
		filename: 'scripts/static.[name].js',
		publicPath: 'http://localhost:5000/',
	},
	mode: 'development',
	optimization: {
		runtimeChunk: true,
	},
	plugins: [new CleanWebpackPlugin('./dist'),new HtmlWebpackPlugin()],
};
