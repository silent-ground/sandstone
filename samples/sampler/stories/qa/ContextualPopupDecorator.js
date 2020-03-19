import {select} from '@enact/storybook-utils/addons/knobs';
import {mergeComponentMetadata} from '@enact/storybook-utils';
import {Group} from '@enact/ui/Group';
import ri from '@enact/ui/resolution';
import React from 'react';
import {storiesOf} from '@storybook/react';

import Button from '@enact/sandstone/Button';
import CheckboxItem from '@enact/sandstone/CheckboxItem';
import {ContextualPopupDecorator} from '@enact/sandstone/ContextualPopupDecorator';
import Heading from '@enact/sandstone/Heading';

const ContextualButton = ContextualPopupDecorator(Button);
const Config = mergeComponentMetadata('ContextualButton', ContextualButton);
ContextualButton.displayName = 'ContextualButton';
const ContextualPopup = ContextualPopupDecorator(Button);

const buttonMargin = () => ({margin: ri.unit(24, 'rem')});

const renderPopup = () => (
	<div>
		<Button style={buttonMargin()}>First Button</Button>
		<Button style={buttonMargin()}>Second Button</Button>
	</div>
);

const renderWidePopup = () => (
	<div style={{width: ri.unit(1002, 'rem')}}>
		This is a wide popup
	</div>
);

const renderTallPopup = () => (
	<div style={{height: ri.unit(402, 'rem')}}>
		This is a tall popup
	</div>
);

const renderSuperTallPopup = () => (
	<div style={{height: ri.unit(1140, 'rem')}}>
		This is a super tall popup.
		Note: this popup does not overflow in full screen mode.
	</div>
);

class ContextualPopupWithActivator extends React.Component {
	constructor (props) {
		super(props);

		this.state = {open: false};
	}

	handleOpenToggle = () => {
		this.setState(({open}) => ({open: !open}));
	}

	render () {
		return (
			<ContextualButton
				{...this.props}
				onClose={this.handleOpenToggle}
				onClick={this.handleOpenToggle}
				open={this.state.open}
			/>
		);
	}
}

// PLAT-77119
class ContextualPopupWithArrowFunction extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			isOpen: false,
			twoGroup: false
		};
	}

	componentDidUpdate (prevProps, prevState) {
		if (this.ref && this.state.twoGroup !== prevState.twoGroup) {
			this.ref.positionContextualPopup();
		}
	}

	handleOnClick = () => {
		this.setState({isOpen: true});
	}

	handleItemClick = () => {
		this.setState((state) => {
			return {twoGroup: !state.twoGroup};
		});
	}

	setRef = (node) => {
		this.ref = node;
	}

	popupComponent = () => {
		return (
			<div style={{display: 'flex'}}>
				<div style={{display: 'flex'}}>
					<Group
						childComponent={CheckboxItem}
						select="multiple"
						selectedProp="selected"
						onClick={this.handleItemClick}
					>
						{['click to change layout']}
					</Group>
				</div>
				{this.state.twoGroup ?
					<div style={{display: 'flex'}}>
						<Group
							childComponent={CheckboxItem}
							select="multiple"
							selectedProp="selected"
						>
							{['dummy item']}
						</Group>
					</div> : null
				}
			</div>
		);
	};
	render () {
		const {...rest} = this.props;

		return (
			<div {...rest} style={{display: 'flex', justifyContent: 'flex-end'}}>
				<ContextualPopup
					ref={this.setRef}
					popupComponent={this.popupComponent}
					open={this.state.isOpen}
					onClick={this.handleOnClick}
				/>
			</div>
		);
	}
}

storiesOf('ContextualPopupDecorator', module)
	.add(
		'with 5-way selectable activator',
		() => (
			<div style={{textAlign: 'center', marginTop: ri.unit(260, 'rem')}}>
				<ContextualPopupWithActivator
					direction={select('direction', ['above', 'above center', 'above left', 'above right', 'below', 'below center', 'below left', 'below right', 'left middle', 'left top', 'left bottom', 'right middle', 'right top', 'right bottom'], Config, 'below')}
					popupComponent={renderPopup}
					spotlightRestrict={select('spotlightRestrict', ['none', 'self-first', 'self-only'], Config, 'self-only')}
				>
					Hello Contextual Button
				</ContextualPopupWithActivator>
			</div>
		)
	)
	.add(
		'with overflows',
		() => (
			<div style={{position: 'relative', width: '100%', height: '100%'}}>
				<Heading showLine>direction Up</Heading>
				<div style={{display: 'flex', justifyContent: 'space-between', marginBottom: ri.unit(24, 'rem')}}>
					<ContextualPopupWithActivator
						direction="above"
						popupComponent={renderWidePopup}
					>
						Overflows Left
					</ContextualPopupWithActivator>
					<ContextualPopupWithActivator
						direction="above"
						popupComponent={renderTallPopup}
					>
						Overflows Top
					</ContextualPopupWithActivator>
					<ContextualPopupWithActivator
						direction="above"
						popupComponent={renderWidePopup}
					>
						Overflows Right
					</ContextualPopupWithActivator>
				</div>
				<div style={{display: 'flex'}}>
					<Heading showLine style={{flexGrow: '1'}}>direction left </Heading>
					<Heading showLine style={{flexGrow: '1'}}>direction right</Heading>
				</div>
				<div style={{display: 'flex', marginBottom: ri.unit(48, 'rem')}}>
					<div style={{flexGrow: '1', display: 'flex', justifyContent: 'space-between'}}>
						<ContextualPopupWithActivator
							direction="left center"
							popupComponent={renderWidePopup}
						>
							Overflows Left
						</ContextualPopupWithActivator>
						<ContextualPopupWithActivator
							direction="left center"
							popupComponent={renderSuperTallPopup}
						>
							Overflows Top
						</ContextualPopupWithActivator>
					</div>
					<div style={{flexGrow: '1', display: 'flex', justifyContent: 'space-between'}}>
						<ContextualPopupWithActivator
							direction="right center"
							popupComponent={renderSuperTallPopup}
						>
							Overflows Top
						</ContextualPopupWithActivator>
						<ContextualPopupWithActivator
							direction="right center"
							popupComponent={renderWidePopup}
						>
							Overflows Right
						</ContextualPopupWithActivator>
					</div>
				</div>
				<div style={{display: 'flex', justifyContent: 'center', marginBottom: ri.unit(48, 'rem')}}>
					<ContextualPopupWithActivator
						direction="left"
						popupComponent={renderSuperTallPopup}
					>
						Overflows Bottom
					</ContextualPopupWithActivator>
					<ContextualPopupWithActivator
						direction="right center"
						popupComponent={renderSuperTallPopup}
					>
						Overflows Bottom
					</ContextualPopupWithActivator>
				</div>
				<Heading showLine>direction down</Heading>
				<div style={{display: 'flex', justifyContent: 'space-between'}}>
					<ContextualPopupWithActivator
						direction="below"
						popupComponent={renderWidePopup}
					>
						Overflows Left
					</ContextualPopupWithActivator>
					<ContextualPopupWithActivator
						direction="below"
						popupComponent={renderTallPopup}
					>
						Overflows Bottom
					</ContextualPopupWithActivator>
					<ContextualPopupWithActivator
						direction="below"
						popupComponent={renderWidePopup}
					>
						Overflows Right
					</ContextualPopupWithActivator>
				</div>
			</div>
		)
	)
	.add(
		'with arrow function',
		() => (
			<ContextualPopupWithArrowFunction />
		)
	);
