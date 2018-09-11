import React from 'react';
import ReactDOM from 'react-dom';
import List from './components/list';
import { isString } from './utils';

function IndexPage(props) {
	if (isString(props.onClick)) {
		return null;
	}

	// 使用全局变量区分环境
	if (process.env.NODE_ENV === 'production') {
		return <List>Index Page [Production]</List>;
	} else {
		return <h1>Index Page [Development]</h1>;
	}
}

ReactDOM.render(<IndexPage />, document.getElementById('root'));

// 5. 加入替换逻辑
if (module.hot) {
	module.hot.accept();
}
