import { createElement, setTextToElement } from './polyfill.js';

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
		this.#App.loadProblem(_problem);
	}
}

export class ProjectSelectionPage extends Page {
	#App;

	constructor({HTML}, _app) {
		super(...arguments);
		this.#App = _app;
		this.HTML.projectHolder = this.HTML.page.querySelector('.projectHolder');	
	}

	onOpen() {
		this.updateProblemList(this.#App.availableProblems);
	}

	updateProblemList(_problems) {
		this.HTML.projectHolder.innerHTML = '';
		for (let problem of _problems)
		{
			this.HTML.projectHolder.appendChild(this.#renderProblem(problem));
		}

	}

	#renderProblem(_problem) {
		let el = createElement('div', 'UIPanel problem');
		el.innerHTML = `
			<canvas class='previewCanvas'></canvas>
			<div class="title"></div>
			<div class="subTitle"></div>
		`;

		setTextToElement(el.children[1], _problem.name);
		setTextToElement(el.children[2], _problem.name);
		el.addEventListener('click', () => {
			App.simulationPage.open(_problem);
		});
		return el;
	}
} 