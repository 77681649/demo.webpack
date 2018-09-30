import '../styles/index.less'
import React from 'react';
import ReactDOM from 'react-dom';

start();

async function start() {
	let path = location.pathname;
	let PageComponent;

	if (path === '' || path === '/') {
		PageComponent = (await import(`./pages/index`)).default;
	} else if (path === '/list') {
		PageComponent = (await import(`./pages/list`)).default;
	}

	console.log(PageComponent);

	ReactDOM.render(<PageComponent />, document.getElementById('root'));
}
