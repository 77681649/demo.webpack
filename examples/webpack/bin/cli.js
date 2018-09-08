const { readFileSync } = require('fs');
const { join } = require('path');
const readline = require('readline');
const webpack = require('webpack');
const cwd = join(process.cwd(), process.argv[2]);

const configs = require(join(cwd, 'config.json'));
const configMap = {};

console.log('Please choice a example:');
let key = 1;
for (let name in configs) {
	console.log(`  [${key}] ${name}`);
	configMap[key] = configs[name];
	key++;
}

readCLI();

function readCLI() {
	process.stdout.write('> ');

	process.stdin.setEncoding('utf8');

	process.stdin.on('readable', () => {
		const chunk = process.stdin.read();
		if (chunk !== null) {
			process.stdin.end();

			let index = chunk.toString().trim();
			let configFile = configMap[index];

			compile(require(join(cwd, configFile)));
		}
	});

	process.stdin.on('end', () => {
		process.stdout.write('end');
	});
}

function compile(config) {
	console.log(config);
	const compiler = webpack(config);
	compiler.run(function(err, stats) {
		if (err) {
			lastHash = null;
			console.error(err.stack || err);
			if (err.details) console.error(err.details);
			process.exit(1); // eslint-disable-line
		}

		const statsString = stats.toString('normal');

		if (statsString) process.stdout.write(`${statsString}`);
	});
}
