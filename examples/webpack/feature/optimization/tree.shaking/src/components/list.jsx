import { isString } from '../utils';

export default function List(props) {
	if (isString(props.children)) {
		return <h1>{props.children}</h1>;
	}
}
