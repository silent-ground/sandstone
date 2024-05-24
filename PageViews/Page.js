import kind from '@enact/core/kind';
import PropTypes from 'prop-types';

import * as css from './Page.module.less';

/**
 * Page for {@link sandstone/PageViews.PageViews|PageViews}.
 *
 * @class Page
 * @memberof sandstone/PageViews
 * @ui
 * @public
 */

const Page = kind({
	name: 'Page',
	propTypes: /** @lends sandstone/PageViews.Page.prototype */ {
		/**
		 * Contents of the page.
		 *
		 * @type {Node}
		 * @public
		 */
		children: PropTypes.node,

		/**
		 * Customizes the component by mapping the supplied collection of CSS class names to the
		 * corresponding internal elements and states of this component.
		 *
		 * The following classes are supported:
		 *
		 * * `page` - The root component class
		 *
		 * @type {Object}
		 * @public
		 */
		css: PropTypes.object
	},
	styles: {
		css: css,
		className: 'page',
		publicClassNames: true
	},
	render: ({children, ...rest}) => {
		return (
			<div {...rest}>
				{children}
			</div>
		);

	}
});

export default Page;
export {
	Page
};
