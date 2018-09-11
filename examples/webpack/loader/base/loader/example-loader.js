module.exports = function(source) {
	['request', 'query', 'context', 'resource', 'resoucePath', 'resourceQuery', 'target'].forEach(p => {
		console.log(`${p}:`, this[p]);
	});
	return source;
};
