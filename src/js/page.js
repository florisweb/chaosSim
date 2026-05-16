import { Vector2D } from './vector.js';
import { createElement, setTextToElement, wait } from './polyfill.js';
import { Simulation } from './simulation/simulation.js';

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






import GraphPanel from './graphPanel.js';
import SimulationPanel from './simulationPanel.js';
import HeaderPanel from './headerPanel.js';
import ControlPanel from './controlPanel.js';
import DocumentationPanel from './docPanel.js';

export class SimulationPage extends Page {
	#App;
	#HTML = {
		simulationPanel: document.querySelector('.UIPanel.simulationPanel'),
		documentationPanel: document.querySelector('.UIPanel.documentationPanel'),
	}

	constructor({HTML}, _app) {
		super(...arguments);
		this.#App = _app;
		this.graphPanel = new GraphPanel({panel: document.querySelector('.UIPanel.graphPanel')});
		this.simulationPanel = new SimulationPanel({panel: this.#HTML.simulationPanel}, this.#App);
		this.headerPanel = new HeaderPanel({panel: document.querySelector('.UIPanel.headerPanel')}, this.#App);
		this.controlPanel = new ControlPanel({panel: document.querySelector('.UIPanel.controlPanel')});
		this.documentationPanel = new DocumentationPanel({panel: this.#HTML.documentationPanel});
	}
	onOpen(_problem) {
		if (!_problem) return;
		this.#App.loadProblem(_problem);
		this.#HTML.simulationPanel.style.width = 'calc(var(--contentHeight) * ' +  this.#App.problem.renderer.viewSize.x / this.#App.problem.renderer.viewSize.y + ')';
		this.#HTML.simulationPanel.style.minWidth = this.#HTML.simulationPanel.style.width;
	}

	onProblemChange(_problem) {
		this.graphPanel.clear();
		this.graphPanel.onProblemChange(_problem);
		this.headerPanel.onProblemChange(_problem);
		this.controlPanel.onProblemChange(_problem);
		this.simulationPanel.onProblemChange(_problem);
		this.documentationPanel.onProblemChange(_problem);
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


	updateProblemList(_problemClasses) {
		this.HTML.projectHolder.innerHTML = '';
		for (let problemClass of _problemClasses)
		{
			this.HTML.projectHolder.appendChild(this.#renderProblem(problemClass));
		}
	}

	#renderProblem(_problemClass) {
		let el = createElement('div', 'UIPanel problem');
		el.innerHTML = `
			<canvas class='previewCanvas'></canvas>
			<div class="title"></div>
			<div class="subTitle"></div>
		`;

		const problem = new _problemClass();
		problem.setup({canvas: el.children[0]});

		setTextToElement(el.children[1], _problemClass.name);
		setTextToElement(el.children[2], this.#generateProblemDescriptionText(problem.simulation));
		el.addEventListener('click', () => App.simulationPage.open(_problemClass));
		
		this.#renderProblemPreview(problem);
		return el;
	}
	#generateProblemDescriptionText(_simulation) {
		// TODO make the problem generate its description text
		let potentials = _simulation.potentialTypes ? _simulation.potentialTypes.map(p => p.name) : [];
		let dynamics = _simulation.getDynamicTypes ? _simulation.getDynamicTypes(_simulation.objects).map(d => d.name) : [];
		dynamics = dynamics.filter(d => ['SpringDynamic', 'GravityDynamic'].includes(d));
		return (potentials.length > 0 ? potentials.join(', ') + (dynamics.length ? ' - ' : '') : '') + dynamics.join(', ');
	}

	#renderProblemPreview(_problem) {
		wait(0).then(() => {
			_problem.renderer.onResize();
			_problem.renderer.draw(_problem.simulation, {})
		});
	}
} 