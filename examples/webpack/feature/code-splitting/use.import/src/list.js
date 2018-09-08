const utils = require('./utils');
const react = require('./react');

module.exports = function module1() {
	console.log('module2');

	// async
	import('./components/light-box').then(LightBox => {
		new LightBox();
	});
};
