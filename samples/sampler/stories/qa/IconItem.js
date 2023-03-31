import Button from '@enact/sandstone/Button';
import IconItem from '@enact/sandstone/IconItem';
import Scroller from '@enact/sandstone/Scroller';
import {mergeComponentMetadata} from '@enact/storybook-utils';
import {action} from '@enact/storybook-utils/addons/actions';
import {boolean, number, select} from '@enact/storybook-utils/addons/controls';
import ri from '@enact/ui/resolution';
import {ScrollerBasic as UiScrollerBasic} from '@enact/ui/Scroller';
import {useCallback, useLayoutEffect, useRef, useState} from 'react';

import galleryIcon from '../../images/icon_app_gallery.png';
import gameHomeIcon from '../../images/icon_app_game.png';
import homeOfficeIcon from '../../images/icon_app_homeoffice.png';
import mediaDiscoveryIcon from '../../images/icon_app_mediadiscovery.png';

import css from './IconItem.module.less';

const ScrollerConfig = mergeComponentMetadata('Scroller', UiScrollerBasic, Scroller);
const prop = {
	direction: ['both', 'horizontal', 'vertical'],
	focusableScrollbarOption: {
		false: false,
		true: true,
		byEnter: 'byEnter'
	},
	scrollbarOption: ['auto', 'hidden', 'visible'],
	scrollModeOption: ['native', 'translate']
};

let itemsArr = [];
const imageSrcs = [
	'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MDAiIGhlaWdodD0iNzAwIiB2aWV3Qm94PSIwIDAgNzAwIDcwMCI+PGRlZnM+PHN0eWxlPi5hLC5ie2ZpbGw6I2ZmZjt9LmJ7b3BhY2l0eTowLjg7fTwvc3R5bGU+PC9kZWZzPjxwb2x5Z29uIGNsYXNzPSJhIiBwb2ludHM9IjM0OS45IDUyNy44IDE5OS45IDQyOS44IDE5OS45IDM3NC40IDM1MC4xIDQ3Mi43IDM0OS45IDM0OC41IDE5OS45IDI2MS4xIDE5OS45IDIwOS4zIDM1MCAyOTMuNiAzNTAgMjkzLjYgMzUwLjIgMjkzLjcgMzQ5LjkgMTY5LjMgMTAyLjcgNDguNSAxMDIuNyA0NzIuNiAzNTAuMSA2NTEuNiAzNDkuOSA1MjcuOCIvPjxwb2x5Z29uIGNsYXNzPSJiIiBwb2ludHM9IjM1MC4xIDY1MS42IDU5Ny4zIDQ3Mi44IDU5Ny4zIDM2Ni4zIDM0OS45IDUyNy44IDM1MC4xIDY1MS42Ii8+PHBvbHlnb24gY2xhc3M9ImIiIHBvaW50cz0iMzUwLjEgNDcyLjcgNTIzLjUgMzU5LjMgNTIzLjUgMjQ3LjQgMzQ5LjkgMzQ4LjUgMzUwLjEgNDcyLjciLz48cG9seWdvbiBjbGFzcz0iYiIgcG9pbnRzPSIzNTAgMjkzLjYgMzUwIDI5My42IDM1MC4yIDI5My43IDU5Ny4zIDE1NC44IDU5Ny4zIDQ4LjQgMzQ5LjkgMTY5LjMgMzUwIDI5My42Ii8+PC9zdmc+',
	galleryIcon,
	gameHomeIcon,
	homeOfficeIcon,
	mediaDiscoveryIcon
];

const populateItems = ({index}) => {
	const color = Math.floor(Math.random() * (0x1000000 - 0x101010) + 0x101010).toString(16);
	const iconItemProps = {
		background: (function () {
			if (index < 2) return '#1b1b1b';
			else if (index % 6 === 0) return '#ffffff';
			else return '#' + color;
		})(),
		bordered: index < 2,
		icon: index === 0 ? 'demosync' : (index === 1 ? 'usb' : ''), // eslint-disable-line no-nested-ternary
		image: index > 1 ? {
			src: imageSrcs[index % 5],
			size: {
				width: ri.scaleToRem(150),
				height: ri.scaleToRem(150)
			}
		} : null,
		label: (function () {
			if (index === 1) return 'USB';
			else if (index === 6) return 'Gallery';
		})(),
		labelColor: index === 6 ? 'dark' : null,
		labelOn: index === 6 ? 'focus' : null
	};

	return {index, iconItemProps};
};

for (let i = 0; i < 20; i++) {
	itemsArr.push(populateItems({index: i}));
}

export const EditableIcon = (args) => {
	const dataSize = args['editableDataSize'];
	const [items, setItems] = useState(itemsArr);
	const removeItem = useRef();

	useLayoutEffect(() => {
		itemsArr = [];
		for (let i = 0; i < dataSize; i++) {
			itemsArr.push(populateItems({index: i}));
		}
		setItems(itemsArr);
	}, [dataSize]);

	const onClickRemoveButton = useCallback((ev) => {
		if (removeItem.current) {
			removeItem.current();
		}
		ev.preventDefault();
		ev.stopPropagation();
	}, []);

	const handleComplete = useCallback((ev) => {
		const {orders} = ev;
		// change data from the new orders
		const newItems = [];

		orders.forEach(order => {
			newItems.push(items[order - 1]);
		});

		setItems(newItems);
	}, [items]);

	return (
		<Scroller
			direction="horizontal"
			editable={{
				centered: args['editableCentered'],
				css,
				onComplete: handleComplete,
				removeItemFuncRef: removeItem
			}}
			focusableScrollbar={args['focusableScrollbar']}
			horizontalScrollbar={args['horizontalScrollbar']}
			hoverToScroll={args['hoverToScroll']}
			key={args['scrollMode']}
			noScrollByWheel={args['noScrollByWheel']}
			onClick={action('onClickScroller')}
			onKeyDown={action('onKeyDown')}
			onScrollStart={action('onScrollStart')}
			onScrollStop={action('onScrollStop')}
			scrollMode={args['scrollMode']}
			spotlightDisabled={args['spotlightDisabled']}
			verticalScrollbar={args['verticalScrollbar']}
		>
			{
				items.map((item, index) => {
					return (
						<div key={item.index} className={css.itemWrapper} aria-label={`Image ${item.index}`} data-index={item.index} style={{order: index + 1}}>
							<div className={css.removeButtonContainer}>
								<Button aria-label="Delete" className={css.removeButton} onClick={onClickRemoveButton} icon="trash" />
							</div>
							<IconItem
								aria-label={`Image ${item.index}. Edit mode to press and hold OK key`}
								className={css.iconItem}
								onClick={action('onClickItem')}
								{...item.iconItemProps}
							/>
						</div>
					);
				})
			}
		</Scroller>
	);
};

boolean('editableCentered', EditableIcon, ScrollerConfig, true);
number('editableDataSize', EditableIcon, ScrollerConfig, 20);
select('focusableScrollbar', EditableIcon, prop.focusableScrollbarOption, ScrollerConfig);
select('horizontalScrollbar', EditableIcon, prop.scrollbarOption, ScrollerConfig);
boolean('hoverToScroll', EditableIcon, ScrollerConfig, true);
boolean('noScrollByWheel', EditableIcon, ScrollerConfig);
select('scrollMode', EditableIcon, prop.scrollModeOption, ScrollerConfig);
boolean('spotlightDisabled', EditableIcon, ScrollerConfig, false);
select('verticalScrollbar', EditableIcon, prop.scrollbarOption, ScrollerConfig);

EditableIcon.storyName = 'with editable scroller';

export default {
	title: 'Sandstone/IconItem',
	component: 'IconItem'
};