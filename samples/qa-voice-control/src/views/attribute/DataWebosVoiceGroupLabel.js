import Button from '@enact/sandstone/Button';
import Heading from '@enact/sandstone/Heading';
import React from 'react';

import CommonView from '../../components/CommonView';


class DataWebosVoiceGroupLabel extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			result: ''
		};
		this.voiceGroupLabels = JSON.stringify(['우리집', '외국']);
	}

	updateResult = (msg) => () => {
		this.setState({result: msg});
		setTimeout(() => (this.setState({result: ''})), 1500);
	};

	render () {
		return (
			<CommonView title="data-webos-voice-group-label" subtitle={this.state.result}>
				<Heading>Group Name | 동물원</Heading>
				<div>
					<Button data-webos-voice-group-label="동물원" onClick={this.updateResult('clickHandler> 동물원 | 고양이')}>고양이</Button>
					<Button data-webos-voice-group-label="동물원" onClick={this.updateResult('clickHandler> 동물원 | 강아지')}>강아지</Button>
				</div>
				<Heading>Group Name | 운동장</Heading>
				<div>
					<Button data-webos-voice-group-label="운동장" onClick={this.updateResult('clickHandler> 운동장 | 고양이')}>고양이</Button>
					<Button data-webos-voice-group-label="운동장" onClick={this.updateResult('clickHandler> 운동장 | 강아지')}>강아지</Button>
				</div>
				<Heading>Group Names | 우리집, 외국</Heading>
				<div>
					<Button data-webos-voice-group-labels={this.voiceGroupLabels} onClick={this.updateResult('clickHandler> 우리집, 외국 | 고양이')}>고양이</Button>
					<Button data-webos-voice-group-labels={this.voiceGroupLabels} onClick={this.updateResult('clickHandler> 우리집, 외국 | 강아지')}>강아지</Button>
				</div>
			</CommonView>
		);
	}
}

export default DataWebosVoiceGroupLabel;