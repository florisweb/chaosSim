import Panel from './panel.js';
import { setTextToElement, createElement } from './polyfill.js';

export default class SimulationPanel extends Panel {
	#simulation;
	#app;
	constructor({panel}, _simulation, _app) {
		super({panel});
		this.#app = _app;
		this.#simulation = _simulation;
		this.HTML.controlLegend = {
			panel: panel.querySelector('.controlLegendPanel')
		}
		this.HTML.curTime = panel.querySelector('.text.time')
		this.HTML.button = panel.querySelector('.button');
		this.HTML.speedIndicator = panel.querySelector('.text.speed');

		this.HTML.button.addEventListener('click', () => this.#onSpeedButtonClick());
		this.#onSpeedButtonClick();
	}

	onResize() {
		this.#app.renderer.onResize();
	}


	update(_simulation) {
		setTextToElement(this.HTML.curTime, Math.round(_simulation.time) + 's');
	}
	onProblemChange(_problem, _simulation) {
		this.#updateControlLegend(_simulation);
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

	#updateControlLegend(_simulation) {
		this.HTML.controlLegend.panel.innerHTML = '';
		this.HTML.controlLegend.panel.classList.toggle('hide', _simulation.potentialTypes.length === 0);

		for (let potType of _simulation.potentialTypes)
		{
			let el = createElement('div', 'potType');
			setTextToElement(el, potType.type);
			this.HTML.controlLegend.panel.append(el);
			el.addEventListener('click', () => {
				if (this.#app.config.renderer.renderPotType === potType.type) 
				{
					this.#app.config.renderer.renderPotType = '';
				} else {
					this.#app.config.renderer.renderPotType = potType.type;
				}
			})
		}
	}
}