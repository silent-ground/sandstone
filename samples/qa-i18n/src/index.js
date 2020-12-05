import React from 'react';
import {render} from 'react-dom';

import App from './App';

console.log('React.version in sample: ', React.version);

const appElement = (<App />);

// In a browser environment, render instead of exporting
if (typeof window !== 'undefined') {
	render(appElement, document.getElementById('root'));
}

export default appElement;
