import { setTextToElement } from './polyfill.js';

export default class SimulationPanel {
	HTML = {}
	#simulation;
	constructor({panel}, _simulation) {
		this.#simulation = _simulation;
		this.HTML.panel = panel;
		this.HTML.curTime = panel.querySelector('.text.time')
		this.HTML.button = panel.querySelector('.button');
		this.HTML.speedIndicator = panel.querySelector('.text.speed');

		this.HTML.button.addEventListener('click', () => this.#onSpeedButtonClick());
		this.#onSpeedButtonClick();
	}

	update(_simulation) {
		setTextToElement(this.HTML.curTime, Math.round(_simulation.time) + 's');
		
	}
	#onSpeedButtonClick() {
		let curSpeed = parseInt(this.HTML.button.getAttribute('speedState'));
		let newSpeed = 0;
		switch (curSpeed)
		{
			case 0: newSpeed = 1; break;
			case 1: newSpeed = 2; break;
			case 2: newSpeed = 5; break;
			case 5: newSpeed = 10; break;
			case 10: newSpeed = 50; break;
			case 50: newSpeed = 100; break;
			case 100: newSpeed = 0; break;
		}

		this.HTML.button.setAttribute('speedState', newSpeed);
		setTextToElement(this.HTML.speedIndicator, newSpeed + 'x');
		this.#simulation.setSpeed(newSpeed);
	}
}