import hoc from '@enact/core/hoc';
import {forward} from '@enact/core/handle';
import {childrenEquals} from '@enact/core/util';
import React from 'react';

import Marquee from './Marquee';

/**
 * Default configuration parameters for {@link module:@enact/moonstone/Marquee~MarqueeDecorator}
 *
 * @type {Object}
 */
const defaultConfig = {
	/**
	 * Property containing the callback to stop the animation when `marqueeOn` is 'focus'
	 *
	 * @type {String}
	 * @default 'onBlur'
	 */
	blur: 'onBlur',

	/**
	 * Optional CSS class to apply to the marqueed element
	 *
	 * @type {String}
	 * @default null
	 */
	className: null,

	/**
	 * Property containing the callback to start the animation when `marqueeOn` is 'hover'
	 *
	 * @type {String}
	 * @default 'onMouseEnter'
	 */
	enter: 'onMouseEnter',

	/**
	 * Property containing the callback to start the animation when `marqueeOn` is 'focus'
	 *
	 * @type {String}
	 * @default 'onFocus'
	 */
	focus: 'onFocus',

	/**
	 * Property containing the callback to stop the animation when `marqueeOn` is 'hover'
	 *
	 * @type {String}
	 * @default 'onMouseLeave'
	 */
	leave: 'onMouseLeave'
};

/**
 * {@link module:@enact/moonstone/Marquee~MarqueeDecorator} is a Higher-order Component which makes
 * the Wrapped component's children marquee.
 *
 * @class MarqueeDecorator
 * @ui
 * @public
 */
const MarqueeDecorator = hoc(defaultConfig, (config, Wrapped) => {
	const {blur, className: marqueeClassName, enter, focus, leave} = config;

	// Generate functions to forward events to containers
	const forwardBlur = forward(blur);
	const forwardFocus = forward(focus);
	const forwardEnter = forward(enter);
	const forwardLeave = forward(leave);

	return class extends React.Component {
		static displayName = 'MarqueeDecorator'

		static propTypes = {
			/**
			 * Children to be marqueed
			 *
			 * @type {Node}
			 * @public
			 */
			children: React.PropTypes.node,

			/**
			 * Disables all marquee behavior except when `marqueeOn` is 'hover'. Will be forwarded
			 * onto the wrapped component as well.
			 *
			 * @type {Boolean}
			 * @public
			 */
			disabled: React.PropTypes.bool,

			/**
			 * Number of milliseconds to wait before starting marquee when `marqueeOn` is 'hover' or
			 * 'focus' or before restarting any marquee.
			 *
			 * @type {Number}
			 * @default 1000
			 * @public
			 */
			marqueeDelay: React.PropTypes.number,

			/**
			 * Disables all marquee behavior and removes supporting markup.
			 *
			 * @type {Boolean}
			 */
			marqueeDisabled: React.PropTypes.bool,

			/**
			 * Determines what trigger the marquee to start its animation
			 *
			 * @type {String}
			 * @default 'focus'
			 * @public
			 */
			marqueeOn: React.PropTypes.oneOf(['focus', 'hover', 'render']),

			/**
			 * Number of milliseconds to wait before starting marquee the first time. Has no effect
			 * if `marqueeOn` is not 'render'
			 *
			 * @type {Number}
			 * @default 1000
			 * @public
			 */
			marqueeOnRenderDelay: React.PropTypes.number,

			/**
			 * Number of milliseconds to wait before resetting the marquee after it finishes.
			 *
			 * @type {Number}
			 * @default 1000
			 * @public
			 */
			marqueeResetDelay: React.PropTypes.number,

			/**
			 * Rate of marquee measured in pixels/second.
			 *
			 * @type {Number}
			 * @default 60
			 * @public
			 */
			marqueeSpeed: React.PropTypes.number
		}

		static defaultProps = {
			marqueeDelay: 1000,
			marqueeOn: 'focus',
			marqueeOnRenderDelay: 1000,
			marqueeResetDelay: 1000,
			marqueeSpeed: 60
		}

		constructor (props) {
			super(props);
			this.distance = null;
			this.state = {
				overflow: 'ellipsis'
			};

			this.checkMarqueeOnRender(props);
		}

		componentDidMount () {
			this.initMarquee();
		}

		componentWillReceiveProps (next) {
			const {marqueeOn, marqueeDisabled} = this.props;
			this.checkMarqueeOnRender(next);
			if (next.marqueeOn !== marqueeOn || next.marqueeDisabled !== marqueeDisabled) {
				this.cancelAnimation();
			} else if (!childrenEquals(this.props.children, next.children)) {
				this.distance = null;
				this.cancelAnimation();
			}
		}

		componentDidUpdate () {
			this.initMarquee();
		}

		componentWillUnmount () {
			this.clearTimeout();
		}

		checkMarqueeOnRender (props) {
			this.marqueeOnRender =	props.marqueeOn === 'render' &&
									!props.disabled &&
									!props.marqueeDisabled;

			return this.marqueeOnRender;
		}

		/**
		 * Clears the timer
		 *
		 * @returns {undefined}
		 */
		clearTimeout () {
			if (window) {
				window.clearTimeout(this.timer);
			}
			this.timer = null;
		}

		/**
		 * Starts a new timer
		 *
		 * @param {Function} fn   Callback
		 * @param {Number}   time Delay in milliseconds
		 * @returns {undefined}
		 */
		setTimeout (fn, time) {
			this.clearTimeout();
			if (window) {
				this.timer = window.setTimeout(fn, time);
			}
		}

		/**
		 * Initializes the marquee by calculating the distance and conditionally starting the
		 * animation
		 *
		 * @returns {undefined}
		 */
		initMarquee () {
			this.calcDistance();
			if (this.marqueeOnRender) {
				this.startAnimation(this.props.marqueeOnRenderDelay);
			}
		}

		/**
		* Determine if the marquee should animate
		*
		* @param {Number} [distance] Marquee distance
		* @returns {Boolean} Returns `true` if this control has enough content to animate.
		* @private
		*/
		shouldAnimate (distance) {
			const d = distance === null ? this.calcDistance() : distance;
			return d > 0;
		}

		/**
		* Determines how far the marquee needs to scroll.
		*
		* @returns {Number} Marquee distance
		* @private
		*/
		calcDistance () {
			const node = this.node;
			let rect;

			// TODO: absolute showing check (or assume that it won't be rendered if it isn't showing?)
			if (node && this.distance == null) {
				rect = node.getBoundingClientRect();
				this.distance = Math.floor(Math.abs(node.scrollWidth - rect.width));

				// if the distance is exactly 0, then the ellipsis
				// most likely are hiding the content, and marquee does not
				// need to animate
				if (this.distance === 0) {
					this.setState({overflow: 'clip'});
				} else {
					this.setState({overflow: 'ellipsis'});
				}
			}

			return this.distance;
		}

		/**
		* Starts marquee animation.
		*
		* @param {Number} [delay] Milleseconds to wait before animating
		* @returns {undefined}
		*/
		startAnimation = (delay = this.props.marqueeDelay) => {
			if (this.state.animating || this.contentFits) return;

			const distance = this.calcDistance();

			this.contentFits = !this.shouldAnimate(distance);
			if (!this.contentFits) {
				this.setTimeout(() => {
					this.setState({
						animating: true
					});
				}, delay);
			}
		}

		/**
		 * Resets the marquee and restarts it after `marqueeDelay` millisecons.
		 *
		 * @returns {undefined}
		 */
		restartAnimation = () => {
			this.setState({
				animating: false
			});
			this.startAnimation();
		}

		/**
		 * Resets and restarts the marquee after `marqueeResetDelay` milliseconds
		 *
		 * @returns {undefined}
		 */
		resetAnimation = () => {
			this.setTimeout(this.restartAnimation, this.props.marqueeResetDelay);
		}

		/**
		 * Cancels the marquee
		 *
		 * @returns {undefined}
		 */
		cancelAnimation = () => {
			this.clearTimeout();
			this.setState({
				animating: false
			});
		}

		handleMarqueeComplete = (ev) => {
			this.resetAnimation();
			ev.stopPropagation();
		}

		handleFocus = (ev) => {
			this.startAnimation();
			forwardFocus(ev, this.props);
		}

		handleBlur = (ev) => {
			this.cancelAnimation();
			forwardBlur(ev, this.props);
		}

		handleEnter = (ev) => {
			this.startAnimation();
			forwardEnter(ev, this.props);
		}

		handleLeave = (ev) => {
			this.cancelAnimation();
			forwardLeave(ev, this.props);
		}

		cacheNode = (node) => {
			this.node = node;
		}

		renderMarquee () {
			const {
				children,
				disabled,
				marqueeOn,
				marqueeSpeed,
				...rest
			} = this.props;

			const marqueeOnFocus = marqueeOn === 'focus';
			const marqueeOnHover = marqueeOn === 'hover';

			if (marqueeOnFocus && !disabled) {
				rest[focus] = this.handleFocus;
				rest[blur] = this.handleBlur;
			}

			// TODO: cancel others on hover
			if ((marqueeOnHover && !marqueeOnFocus) || (disabled && marqueeOnFocus)) {
				rest[enter] = this.handleEnter;
				rest[leave] = this.handleLeave;
			}

			delete rest.marqueeDelay;
			delete rest.marqueeDisabled;
			delete rest.marqueeOnRenderDelay;
			delete rest.marqueeResetDelay;
			delete rest.marqueeSpeed;

			return (
				<Wrapped {...rest} disabled={disabled}>
					<Marquee
						animating={this.state.animating}
						className={marqueeClassName}
						clientRef={this.cacheNode}
						distance={this.distance}
						onMarqueeComplete={this.handleMarqueeComplete}
						overflow={this.state.overflow}
						speed={marqueeSpeed}
					>
						{children}
					</Marquee>
				</Wrapped>
			);
		}

		renderWrapped () {
			const props = Object.assign({}, this.props);

			delete props.marqueeDelay;
			delete props.marqueeDisabled;
			delete props.marqueeOn;
			delete props.marqueeOnRenderDelay;
			delete props.marqueeResetDelay;
			delete props.marqueeSpeed;

			return <Wrapped {...props} />;
		}

		render () {
			if (this.props.marqueeDisabled) {
				return this.renderWrapped();
			} else {
				return this.renderMarquee();
			}
		}
	};

});

export default MarqueeDecorator;
export {MarqueeDecorator};
