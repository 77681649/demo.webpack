//
// output: 使用publicPath指定deamon
//

const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const context = path.join(__dirname, 'src');
const output = path.join(__dirname, './dist');

module.exports = {
	context,
	entry: 'react',
	devtool: 'source-map',
	output: {
		path: output,
		libraryTarget: 'var',
	},
	mode: 'development',
	plugins: [new CleanWebpackPlugin(output), new HtmlWebpackPlugin()],
};
