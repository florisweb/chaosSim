import { Vector2D } from './vector.js';
import { createElement, setTextToElement, wait } from './polyfill.js';
import { Simulation } from './simulation.js';
import { BaseObjectRenderer } from './renderer.js';

class Page {
	static pages = [];
	static open(_page, _arguments) {
		for (let page of Page.pages) 
		{
			page.HTML.page.classList.toggle('hide', page !== _page);
			if (page === _page) 
			{
				page.onOpen(..._arguments)
			} else page.onClose()
		}
	}


	HTML = {};

	get isOpen() {
		return !this.HTML.page.classList.contains('hide');
	}

	constructor({HTML}) {
		this.HTML.page = HTML;
		Page.pages.push(this);
	}

	open() {
		Page.open(this, arguments);
	}


	onOpen() {}
	onClose() {}
}



export class SimulationPage extends Page {
	#App;
	constructor({HTML}, _app) {
		super(...arguments);
		this.#App = _app;
	}
	onOpen(_problem) {
		if (!_problem) return;
		this.#App.loadProblem(_problem);
	}
}

export class ProjectSelectionPage extends Page {
	#App;

	constructor({HTML}, _app) {
		super(...arguments);
		this.#App = _app;
		this.HTML.projectHolder = this.HTML.page.querySelector('.projectHolder');	
		this.updateProblemList(this.#App.availableProblems);
	}

	onOpen() {}


	updateProblemList(_problems) {
		this.HTML.projectHolder.innerHTML = '';
		for (let problem of _problems)
		{
			this.HTML.projectHolder.appendChild(this.#renderProblem(problem));
		}
	}

	#renderProblem(_problem) {
		const size = new Vector2D(50, 50);
		const simulation = new Simulation({size: size});
		_problem.setup(simulation);
		simulation.setup();

		let el = createElement('div', 'UIPanel problem');
		el.innerHTML = `
			<canvas class='previewCanvas'></canvas>
			<div class="title"></div>
			<div class="subTitle"></div>
		`;

		setTextToElement(el.children[1], _problem.name);
		setTextToElement(el.children[2], this.#generateProblemDescriptionText(simulation));
		el.addEventListener('click', () => App.simulationPage.open(_problem));
		
		this.#renderProblemPreview(el.children[0], simulation, _problem);
		return el;
	}
	#generateProblemDescriptionText(_simulation) {
		let potentials = _simulation.potentialTypes.map(p => p.name);
		let dynamics = _simulation.getDynamicTypes(_simulation.objects).map(d => d.name);
		dynamics = dynamics.filter(d => ['SpringDynamic', 'GravityDynamic'].includes(d));
		return (potentials.length > 0 ? potentials.join(', ') + (dynamics.length ? ' - ' : '') : '') + dynamics.join(', ');

	}

	#renderProblemPreview(_canvas, _simulation, _problem) {
		wait(0).then(() => {
			const renderer = new _problem.renderer({canvas: _canvas, viewSize: _simulation.size});
			renderer.draw(_simulation, {});
		});
	}
} 