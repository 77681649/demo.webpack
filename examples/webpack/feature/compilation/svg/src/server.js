import { createServer } from 'http';
import { readFileSync, createReadStream } from 'fs';
import { join } from 'path';
import ejs from 'ejs';
import React from 'react';
import { renderToString } from 'react-dom/server';
import IndexPage from './pages/index';
import ListPage from './pages/list';

const template = readFileSync(join('index.ejs'), {
	encoding: 'utf-8',
});
console.log(template);

createServer(function(req, res) {
	let path = req.url;
	let PageComponent;

	console.log('path', path);
	if (path === '' || path === '/') {
		PageComponent = IndexPage;
	} else if (path === '/list') {
		PageComponent = ListPage;
	} else {
		PageComponent = null;
	}

	if (PageComponent) {
		let content = ejs.render(template, {
			title: 'SSR',
			content: renderToString(<PageComponent />),
		});

		res.end(content);
	} else {
		createReadStream(join('../dist', path)).pipe(res);
	}
}).listen(8080, function() {
	console.log('server is started. [http://localhost:8080]');
});
