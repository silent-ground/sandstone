import {forward} from '@enact/core/handle';
import platform from '@enact/core/platform';
import {onWindowReady} from '@enact/core/snapshot';
import {clamp} from '@enact/core/util';
import Spotlight, {getDirection} from '@enact/spotlight';
import {getRect} from '@enact/spotlight/src/utils';
import {getTargetByDirectionFromElement} from '@enact/spotlight/src/target';
import {constants, ScrollContext as uiScrollContext} from '@enact/ui/Scrollable';
import utilEvent from '@enact/ui/Scrollable/utilEvent';
import utilDOM from '@enact/ui/Scrollable/utilDOM';
import {useContext, useEffect, useRef} from 'react';

import {ScrollContext} from './Scrollable';

const {animationDuration, epsilon, isPageDown, isPageUp, overscrollTypeOnce, paginationPageMultiplier, scrollWheelPageMultiplierForMaxPixel} = constants;
let lastPointer = {x: 0, y: 0};

const useEventFocus = (props, context) => {
	const {scrollMutableRef} = useContext(ScrollContext);
	const {scrollMutableRef: uiScrollMutableRef, uiScrollContainerRef, uiChildContainerRef} = useContext(uiScrollContext);
	const {isDragging, lastInputType, scrolling, scrollLeft, scrollTop} = uiScrollMutableRef.current;
	const {alertThumb} = context;
	const {type} = props;

	// Functions

	const startScrollOnFocus = (pos) => {
		if (pos) {
			const
				{top, left} = pos,
				bounds = uiScrollMutableRef.current.getScrollBounds();

			if (type === 'JS') {
				const
					scrollHorizontally = bounds.maxLeft > 0 && left !== scrollLeft,
					scrollVertically = bounds.maxTop > 0 && top !== scrollTop;

				if (scrollHorizontally || scrollVertically) {
					uiScrollMutableRef.current.start({
						targetX: left,
						targetY: top,
						animate: (animationDuration > 0) && scrollMutableRef.current.animateOnFocus,
						overscrollEffect: props.overscrollEffectOn[lastInputType] &&
							(!scrollMutableRef.current.shouldPreventOverscrollEffect || !scrollMutableRef.current.shouldPreventOverscrollEffect())
					});
					scrollMutableRef.current.lastScrollPositionOnFocus = pos;
				}
			} else {
				const
					scrollHorizontally = bounds.maxLeft > 0 && Math.abs(left - scrollLeft) > epsilon,
					scrollVertically = bounds.maxTop > 0 && Math.abs(top - scrollTop) > epsilon;

				if (scrollHorizontally || scrollVertically) {
					uiScrollMutableRef.current.start({
						targetX: left,
						targetY: top,
						animate: scrollMutableRef.current.animateOnFocus,
						overscrollEffect: props.overscrollEffectOn[lastInputType] &&
							(!scrollMutableRef.current.shouldPreventOverscrollEffect || !scrollMutableRef.current.shouldPreventOverscrollEffect())
					});
					scrollMutableRef.current.lastScrollPositionOnFocus = pos;
				}
			}
		}
	};

	function calculateAndScrollTo () {
		const
			positionFn = scrollMutableRef.current.calculatePositionOnFocus,
			childContainerNode = uiChildContainerRef.current,
			spotItem = Spotlight.getCurrent();

		if (spotItem && positionFn && utilDOM.containsDangerously(childContainerNode, spotItem)) {
			const lastPos = scrollMutableRef.current.lastScrollPositionOnFocus;
			let pos;

			// If scroll animation is ongoing, we need to pass last target position to
			// determine correct scroll position.
			if (lastPos & (
				type === 'JS' && uiScrollMutableRef.current.animator.isAnimating() ||
				type === 'Native' && scrolling
			)) {
				const
					containerRect = getRect(childContainerNode),
					itemRect = getRect(spotItem);
				let scrollPosition;

				if (props.direction === 'horizontal' || props.direction === 'both' && !(itemRect.left >= containerRect.left && itemRect.right <= containerRect.right)) {
					scrollPosition = lastPos.left;
				} else if (props.direction === 'vertical' || props.direction === 'both' && !(itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom)) {
					scrollPosition = lastPos.top;
				}

				pos = positionFn({item: spotItem, scrollPosition});
			} else {
				// scrollInfo passes in current `scrollHeight` and `scrollTop` before calculations
				const
					scrollInfo = {
						previousScrollHeight: uiScrollMutableRef.current.bounds.scrollHeight,
						scrollTop: scrollTop
					};

				pos = positionFn({item: spotItem, scrollInfo});
			}

			if (pos && (pos.left !== scrollLeft || pos.top !== scrollTop)) {
				startScrollOnFocus(pos);
			}

			// update `scrollHeight`
			uiScrollMutableRef.current.bounds.scrollHeight = uiScrollMutableRef.current.getScrollBounds().scrollHeight;
		}
	}

	function handleFocus (ev) {
		const shouldPreventScrollByFocus = scrollMutableRef.current.shouldPreventScrollByFocus ?
			scrollMutableRef.current.shouldPreventScrollByFocus() :
			false;

		if (type === 'JS' && scrollMutableRef.isWheeling) {
			uiScrollMutableRef.current.stop();
			scrollMutableRef.current.animateOnFocus = false;
		}

		if (!Spotlight.getPointerMode()) {
			alertThumb();
		}

		if (!(shouldPreventScrollByFocus || Spotlight.getPointerMode() || isDragging)) {
			const
				item = ev.target,
				spotItem = Spotlight.getCurrent();

			if (item && item === spotItem) {
				calculateAndScrollTo();
			}
		} else if (scrollMutableRef.current.setLastFocusedNode) {
			scrollMutableRef.current.setLastFocusedNode(ev.target);
		}
	}

	function hasFocus () {
		let current = Spotlight.getCurrent();

		if (!current) {
			const spotlightId = Spotlight.getActiveContainer();
			current = document.querySelector(`[data-spotlight-id="${spotlightId}"]`);
		}

		return utilDOM.containsDangerously(uiScrollContainerRef, current);
	}

	// Return

	return {
		calculateAndScrollTo,
		handleFocus,
		hasFocus
	};
};

const useEventKey = (props, context) => {
	const {scrollMutableRef} = useContext(ScrollContext);;
	const {uiChildContainerRef} = useContext(uiScrollContext);
	const {isContent} = scrollMutableRef.current;
	const {checkAndApplyOverscrollEffectByDirection, hasFocus} = context;
	const {type} = props;

	// Functions

	function handleKeyDown (ev) {
		const {keyCode, repeat, target} = ev;

		forward('onKeyDown', ev, props);

		if (isPageUp(keyCode) || isPageDown(keyCode)) {
			ev.preventDefault();
		}

		scrollMutableRef.current.animateOnFocus = true;

		if (!repeat && hasFocus()) {
			let direction = null;

			if (isPageUp(keyCode) || isPageDown(keyCode)) {
				if (props.direction === 'vertical' || props.direction === 'both') {
					direction = isPageUp(keyCode) ? 'up' : 'down';

					if (isContent(uiChildContainerRef, target)) {
						ev.stopPropagation();
						scrollByPage(direction);
					}
					if (props.overscrollEffectOn.pageKey) {
						checkAndApplyOverscrollEffectByDirection(direction);
					}
				}
			} else if (getDirection(keyCode) && (type === 'JS' || type === 'Native' && !Spotlight.getPointerMode())) {
				const element = Spotlight.getCurrent();

				scrollMutableRef.current.lastInputType = 'arrowKey';
				direction = getDirection(keyCode);

				if (props.overscrollEffectOn.arrowKey && !(element ? getTargetByDirectionFromElement(direction, element) : null)) {
					checkAndApplyOverscrollEffectByDirection(direction);
				}
			}
		}
	}

	function scrollByPage (direction) {
		const {scrollMutableRef: uiScrollMutableRef} = useContext(uiScrollContext);
		const
			{scrollTop} = scrollMutableRef.current,
			focusedItem = Spotlight.getCurrent(),
			bounds = uiScrollMutableRef.current.getScrollBounds(),
			isUp = direction === 'up',
			directionFactor = isUp ? -1 : 1,
			pageDistance = directionFactor * bounds.clientHeight * paginationPageMultiplier;
		let scrollPossible = false;

		if (type === 'JS') {
			scrollPossible = isUp ? scrollTop > 0 : bounds.maxTop > scrollTop;
		} else {
			scrollPossible = isUp ? scrollTop > 0 : bounds.maxTop - scrollTop > epsilon;
		}

		scrollMutableRef.current.lastInputType = 'pageKey';

		if (directionFactor !== scrollMutableRef.current.wheelDirection) {
			uiScrollMutableRef.current.isScrollAnimationTargetAccumulated = false;
			scrollMutableRef.current.wheelDirection = directionFactor;
		}

		if (scrollPossible) {
			if (focusedItem) {
				const contentNode = uiChildContainerRef.current;

				// Should do nothing when focusedItem is paging control button of Scrollbar
				if (utilDOM.containsDangerously(contentNode, focusedItem)) {
					const
						contentRect = contentNode.getBoundingClientRect(),
						clientRect = focusedItem.getBoundingClientRect(),
						yAdjust = isUp ? 1 : -1,
						x = clamp(contentRect.left, contentRect.right, (clientRect.right + clientRect.left) / 2);
					let y = 0;

					if (type === 'JS') {
						y = bounds.maxTop <= scrollTop + pageDistance || 0 >= scrollTop + pageDistance ?
							contentRect[isUp ? 'top' : 'bottom'] + yAdjust :
							clamp(contentRect.top, contentRect.bottom, (clientRect.bottom + clientRect.top) / 2);
					} else {
						y = bounds.maxTop - epsilon < scrollTop + pageDistance || epsilon > scrollTop + pageDistance ?
							contentNode.getBoundingClientRect()[isUp ? 'top' : 'bottom'] + yAdjust :
							clamp(contentRect.top, contentRect.bottom, (clientRect.bottom + clientRect.top) / 2);
					}

					focusedItem.blur();

					if (!props['data-spotlight-container-disabled']) {
						scrollMutableRef.current.setContainerDisabled(true);
					}

					scrollMutableRef.current.pointToFocus = {direction, x, y};
				}
			} else {
				scrollMutableRef.current.pointToFocus = {direction, x: lastPointer.x, y: lastPointer.y};
			}

			uiScrollMutableRef.current.scrollToAccumulatedTarget(pageDistance, true, props.overscrollEffectOn.pageKey);
		}
	}

	function scrollByPageOnPointerMode (ev) {
		const {keyCode, repeat} = ev;

		forward('onKeyDown', ev, props);
		ev.preventDefault();

		scrollMutableRef.current.animateOnFocus = true;

		if (!repeat && (props.direction === 'vertical' || props.direction === 'both')) {
			const direction = isPageUp(keyCode) ? 'up' : 'down';

			scrollByPage(direction);

			if (props.overscrollEffectOn.pageKey) { /* if the spotlight focus will not move */
				checkAndApplyOverscrollEffectByDirection(direction);
			}

			return true; // means consumed
		}

		return false; // means to be propagated
	}

	// Return

	return {
		handleKeyDown,
		lastPointer,
		scrollByPageOnPointerMode
	};
};

/*
 * Track the last position of the pointer to check if a list should scroll by
 * page up/down keys when the pointer is on a list without any focused node.
 * `keydown` event does not occur if there is no focus on the node and
 * its descendants, we add `keydown` handler to `document` also.
 */
const scrollers = new Map();

// An app could have lists and/or scrollers more than one,
// so we should test all of them when page up/down key is pressed.
const pointerTracker = (ev) => {
	lastPointer.x = ev.clientX;
	lastPointer.y = ev.clientY;
};

const pageKeyHandler = (ev) => {
	const {keyCode} = ev;

	if (Spotlight.getPointerMode() && !Spotlight.getCurrent() && (isPageUp(keyCode) || isPageDown(keyCode))) {
		const
			{x, y} = lastPointer,
			elem = document.elementFromPoint(x, y);

		if (elem) {
			for (const [key, value] of scrollers) {
				if (utilDOM.containsDangerously(value, elem)) {
					/* To handle page keys in nested scrollable components,
					 * break the loop only when `scrollByPageOnPointerMode` returns `true`.
					 * This approach assumes that an inner scrollable component is
					 * mounted earlier than an outer scrollable component.
					 */
					if (key.scrollByPageOnPointerMode(ev)) {
						break;
					}
				}
			}
		}
	}
};

const useEventMonitor = (props, context) => {
	const {uiScrollContainerRef} = useContext(uiScrollContext);
	const {lastPointer: lastPointerProp, scrollByPageOnPointerMode} = context;

	// Mutable value

	const mutableRef = useRef({pageKeyHandlerObj: {scrollByPageOnPointerMode}});

	lastPointer = lastPointerProp;

	// Hooks

	useEffect(() => {
		const setMonitorEventTarget = (target) => {
			scrollers.set(mutableRef.current.pageKeyHandlerObj, target);
		};

		const deleteMonitorEventTarget = () => {
			scrollers.delete(mutableRef.current.pageKeyHandlerObj);
		};

		setMonitorEventTarget(uiScrollContainerRef.current);

		return () => {
			// TODO: Replace `this` to something.
			deleteMonitorEventTarget();
		};
	}, [uiScrollContainerRef]);
};

onWindowReady(() => {
	utilEvent('mousemove').addEventListener(document, pointerTracker);
	utilEvent('keydown').addEventListener(document, pageKeyHandler);
});

const useEventMouse = (props) => {
	const {scrollMutableRef} = useContext(ScrollContext);
	const {scrollMutableRef: uiScrollMutableRef} = useContext(uiScrollContext);
	const {type} = props;

	// Functions

	function handleFlick ({direction}) {
		const
			{canScrollHorizontally, canScrollVertically} = uiScrollMutableRef.current,
			bounds = uiScrollMutableRef.current.getScrollBounds(),
			focusedItem = Spotlight.getCurrent();

		if (focusedItem) {
			focusedItem.blur();
		}

		if ((
			direction === 'vertical' && canScrollVertically(bounds) ||
			direction === 'horizontal' && canScrollHorizontally(bounds)
		) && !props['data-spotlight-container-disabled']) {
			scrollMutableRef.current.setContainerDisabled(true);
		}
	}

	function handleMouseDown (ev) {
		if (props['data-spotlight-container-disabled']) {
			ev.preventDefault();
		} else if (type === 'Native') {
			scrollMutableRef.current.setContainerDisabled(false);
		}
	}

	// Return

	return {
		handleFlick,
		handleMouseDown
	};
};

const useEventTouch = () => {
	// Functions

	function handleTouchStart () {
		const focusedItem = Spotlight.getCurrent();

		if (!Spotlight.isPaused() && focusedItem) {
			focusedItem.blur();
		}
	}

	// Return

	return {
		handleTouchStart
	};
};

const useEventVoice = (props) => {
	const {scrollMutableRef: uiScrollMutableRef, uiScrollContainerRef} = useContext(uiScrollContext);

	// Mutable value

	const mutableRef = useRef({
		isVoiceControl: false,
		voiceControlDirection: 'vertical'
	});

	// Functions

	const updateFocusAfterVoiceControl = () => {
		const
			spotItem = Spotlight.getCurrent(),
			scrollContainerNode = uiScrollContainerRef.current;

		if (utilDOM.containsDangerously(scrollContainerNode, spotItem)) {
			const
				viewportBounds = scrollContainerNode.getBoundingClientRect(),
				spotItemBounds = spotItem.getBoundingClientRect(),
				nodes = Spotlight.getSpottableDescendants(scrollContainerNode.dataset.spotlightId),
				first = mutableRef.current.voiceControlDirection === 'vertical' ? 'top' : 'left',
				last = mutableRef.current.voiceControlDirection === 'vertical' ? 'bottom' : 'right';

			if (spotItemBounds[last] < viewportBounds[first] || spotItemBounds[first] > viewportBounds[last]) {
				for (let i = 0; i < nodes.length; i++) {
					const nodeBounds = nodes[i].getBoundingClientRect();

					if (nodeBounds[first] > viewportBounds[first] && nodeBounds[last] < viewportBounds[last]) {
						Spotlight.focus(nodes[i]);
						break;
					}
				}
			}
		}
	};

	function stopVoice () {
		if (mutableRef.current.isVoiceControl) {
			mutableRef.current.isVoiceControl = false;
			updateFocusAfterVoiceControl();
		}
	}

	const isReachedEdge = (scrollPos, ltrBound, rtlBound, isRtl = false) => {
		const bound = isRtl ? rtlBound : ltrBound;
		return (bound === 0 && scrollPos === 0) || (bound > 0 && scrollPos >= bound - 1);
	};

	const handleVoice = (e) => {
		const
			isHorizontal = (props.direction === 'horizontal'),
			isRtl = props.rtl,
			{maxLeft, maxTop} = uiScrollMutableRef.current.getScrollBounds(),
			verticalDirection = ['up', 'down', 'top', 'bottom'],
			horizontalDirection = isRtl ? ['right', 'left', 'rightmost', 'leftmost'] : ['left', 'right', 'leftmost', 'rightmost'],
			movement = ['previous', 'next', 'first', 'last'];
		let
			scroll = e && e.detail && e.detail.scroll,
			index = movement.indexOf(scroll);

		if (index > -1) {
			scroll = isHorizontal ? horizontalDirection[index] : verticalDirection[index];
		}

		mutableRef.current.voiceControlDirection = verticalDirection.includes(scroll) && 'vertical' || horizontalDirection.includes(scroll) && 'horizontal' || null;

		// Case 1. Invalid direction
		if (mutableRef.current.voiceControlDirection === null) {
			mutableRef.current.isVoiceControl = false;
		// Case 2. Cannot scroll
		} else if (
			(['up', 'top'].includes(scroll) && isReachedEdge(scrollTop, 0)) ||
			(['down', 'bottom'].includes(scroll) && isReachedEdge(scrollTop, maxTop)) ||
			(['left', 'leftmost'].includes(scroll) && isReachedEdge(scrollLeft, 0, maxLeft, isRtl)) ||
			(['right', 'rightmost'].includes(scroll) && isReachedEdge(scrollLeft, maxLeft, 0, isRtl))
		) {
			if (window.webOSVoiceReportActionResult) {
				window.webOSVoiceReportActionResult({voiceUi: {exception: 'alreadyCompleted'}});
				e.preventDefault();
			}
		// Case 3. Can scroll
		} else {
			mutableRef.current.isVoiceControl = true;

			if (['up', 'down', 'left', 'right'].includes(scroll)) {
				const
					bounds = uiScrollMutableRef.current.getScrollBounds(),
					directionFactor = (scroll === 'up') || (scroll === 'left' && !isRtl) || (scroll === 'right' && isRtl),
					scrollVertically = verticalDirection.includes(scroll),
					direction = directionFactor ? -1 : 1,
					pageDistance = direction * (scrollVertically ? bounds.clientHeight : bounds.clientWidth) * paginationPageMultiplier;

				mutableRef.current.lastInputType = 'pageKey';

				if (direction !== mutableRef.current.wheelDirection) {
					uiScrollMutableRef.current.isScrollAnimationTargetAccumulated = false;
					mutableRef.current.wheelDirection = direction;
				}

				uiScrollMutableRef.current.scrollToAccumulatedTarget(pageDistance, scrollVertically, props.overscrollEffectOn.pageKey);
			} else { // ['top', 'bottom', 'leftmost', 'rightmost'].includes(scroll)
				uiScrollMutableRef.current.scrollTo({align: verticalDirection.includes(scroll) && scroll || (scroll === 'leftmost' && isRtl || scroll === 'rightmost' && !isRtl) && 'right' || 'left'});
			}

			e.preventDefault();
		}
	};

	function addVoiceEventListener (uiChildContainerRef) {
		if (platform.webos) {
			utilEvent('webOSVoice').addEventListener(uiChildContainerRef, handleVoice);
			uiChildContainerRef.current.setAttribute('data-webos-voice-intent', 'Scroll');
		}
	}

	function removeVoiceEventListener (uiChildContainerRef) {
		if (platform.webos) {
			utilEvent('webOSVoice').removeEventListener(uiChildContainerRef, handleVoice);
			uiChildContainerRef.current.removeAttribute('data-webos-voice-intent');
		}
	}

	// Return

	return {
		addVoiceEventListener,
		removeVoiceEventListener,
		stopVoice
	};
};

const useEventWheel = (props) => {
	const {scrollMutableRef} = useContext(ScrollContext);
	const {scrollMutableRef: uiScrollMutableRef} = useContext(uiScrollContext);
	const {type} = props;

	// Functions

	function handleWheel ({delta}) {
		const focusedItem = Spotlight.getCurrent();

		if (focusedItem) {
			focusedItem.blur();
		}

		if (delta !== 0) {
			scrollMutableRef.current.isWheeling = true;
			if (!props['data-spotlight-container-disabled']) {
				scrollMutableRef.current.setContainerDisabled(true);
			}
		}
	}

	/*
	 * wheel event handler;
	 * - for horizontal scroll, supports wheel action on any children nodes since web engine cannot support this
	 * - for vertical scroll, supports wheel action on scrollbars only
	 */
	function handleWheelNative (ev) {
		const
			overscrollEffectRequired = props.overscrollEffectOn.wheel,
			bounds = uiScrollMutableRef.current.getScrollBounds(),
			canScrollHorizontally = uiScrollMutableRef.current.canScrollHorizontally(bounds),
			canScrollVertically = uiScrollMutableRef.current.canScrollVertically(bounds),
			eventDeltaMode = ev.deltaMode,
			eventDelta = (-ev.wheelDeltaY || ev.deltaY);
		let
			delta = 0,
			needToHideThumb = false;

		if (typeof window !== 'undefined') {
			window.document.activeElement.blur();
		}

		uiScrollMutableRef.current.showThumb(bounds);

		// FIXME This routine is a temporary support for horizontal wheel scroll.
		// FIXME If web engine supports horizontal wheel, this routine should be refined or removed.
		if (canScrollVertically) { // This routine handles wheel events on scrollbars for vertical scroll.
			if (eventDelta < 0 && scrollTop > 0 || eventDelta > 0 && scrollTop < bounds.maxTop) {
				if (!scrollMutableRef.current.isWheeling) {
					if (!props['data-spotlight-container-disabled']) {
						scrollMutableRef.current.setContainerDisabled(true);
					}
					scrollMutableRef.current.isWheeling = true;
				}

				// Not to check if ev.target is a descendant of a wrapped component which may have a lot of nodes in it.
				if (overscrollEffectRequired) {
					uiScrollMutableRef.current.checkAndApplyOverscrollEffect('vertical', eventDelta > 0 ? 'after' : 'before', overscrollTypeOnce);
				}

				ev.stopPropagation();
			} else {
				if (overscrollEffectRequired && (eventDelta < 0 && scrollTop <= 0 || eventDelta > 0 && scrollTop >= bounds.maxTop)) {
					uiScrollMutableRef.current.applyOverscrollEffect('vertical', eventDelta > 0 ? 'after' : 'before', overscrollTypeOnce, 1);
				}

				needToHideThumb = true;
			}
		} else if (canScrollHorizontally) { // this routine handles wheel events on any children for horizontal scroll.
			if (eventDelta < 0 && scrollLeft > 0 || eventDelta > 0 && scrollLeft < bounds.maxLeft) {
				if (!scrollMutableRef.current.isWheeling) {
					if (!props['data-spotlight-container-disabled']) {
						scrollMutableRef.current.setContainerDisabled(true);
					}

					scrollMutableRef.current.isWheeling = true;
				}

				delta = uiScrollMutableRef.current.calculateDistanceByWheel(eventDeltaMode, eventDelta, bounds.clientWidth * scrollWheelPageMultiplierForMaxPixel);
				needToHideThumb = !delta;

				ev.preventDefault();
				ev.stopPropagation();
			} else {
				if (overscrollEffectRequired && (eventDelta < 0 && scrollLeft <= 0 || eventDelta > 0 && scrollLeft >= bounds.maxLeft)) {
					uiScrollMutableRef.current.applyOverscrollEffect('horizontal', eventDelta > 0 ? 'after' : 'before', overscrollTypeOnce, 1);
				}

				needToHideThumb = true;
			}
		}

		if (delta !== 0) {
			/* prevent native scrolling feature for vertical direction */
			ev.preventDefault();

			const direction = Math.sign(delta);

			// Not to accumulate scroll position if wheel direction is different from hold direction
			if (direction !== scrollMutableRef.current.wheelDirection) {
				uiScrollMutableRef.current.isScrollAnimationTargetAccumulated = false;
				scrollMutableRef.current.wheelDirection = direction;
			}

			uiScrollMutableRef.current.scrollToAccumulatedTarget(delta, canScrollVertically, overscrollEffectRequired);
		}

		if (needToHideThumb) {
			uiScrollMutableRef.current.startHidingThumb();
		}
	}

	// Return

	return {
		handleWheel: type === 'JS' ? handleWheel : handleWheelNative
	};
};

export {
	useEventFocus,
	useEventKey,
	useEventMonitor,
	useEventMouse,
	useEventTouch,
	useEventVoice,
	useEventWheel
};
