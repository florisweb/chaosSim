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
		this.HTML.startStopButton = panel.querySelector('.button.startStop');
		this.HTML.refreshButton = panel.querySelector('.button.refresh');
		this.HTML.speedIndicator = panel.querySelector('.text.speed .valueHolder');
		this.HTML.speedSelect = panel.querySelector('.text.speed .speedSelect');

		this.HTML.startStopButton.addEventListener('click', () => this.#onStartStopButtonClick());
		this.HTML.refreshButton.addEventListener('click', () => _app.loadProblem(_app.problem));
		this.HTML.speedSelect.addEventListener('change', () => this.#onSpeedChange());
		this.#onStartStopButtonClick();
		this.#onSpeedChange();
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

	#onStartStopButtonClick() {
		if (this.#simulation.running)
		{
			this.#simulation.setSpeed(0);
			this.HTML.startStopButton.setAttribute('runState', '0');
		} else {
			this.#simulation.setSpeed(parseInt(this.HTML.speedSelect.value));
			this.HTML.startStopButton.setAttribute('runState', '1');
		}
	}

	#onSpeedChange() {
		let newSpeed = parseInt(this.HTML.speedSelect.value);
		setTextToElement(this.HTML.speedIndicator, newSpeed + 'x');
		if (!this.#simulation.running) return;
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