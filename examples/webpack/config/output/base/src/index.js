Promise.all([import('./1'), import('./2')]).then(([module1, module2]) => {
	module1.default();
	module2.default();
});
