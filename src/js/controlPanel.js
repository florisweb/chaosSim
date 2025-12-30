import Panel from './panel.js';

import { Vector2D } from './vector.js';
import { setTextToElement, createElement } from './polyfill.js';
import { PotentialRenderer } from './renderer.js';

export default class ControlPanel extends Panel {
	constructor({panel}) {
		super(...arguments);
		this.HTML.constantsContents = panel.querySelector('.section.constants .sectionContents');
		this.HTML.parameterContents = panel.querySelector('.section.parameters .sectionContents');
		this.HTML.potentialSection = panel.querySelector('.section.potentials'); 
		this.HTML.potentialCanvas = panel.querySelector('.section.potentials .potentialCanvas');

		this.potentialRenderer = new PotentialRenderer({canvas: this.HTML.potentialCanvas, viewSize: new Vector2D(5, 5 / 1.5)});
	}

	onResize() {
		this.potentialRenderer.onResize();
	}

	onProblemChange(_problem, _simulation) {
		this.HTML.constantsContents.innerHTML = '';
		let constObjects = this.#renderObject(_problem.constants);
		for (let obj of constObjects) this.HTML.constantsContents.append(obj);

		this.HTML.parameterContents.innerHTML = '';
		let paramObjects = this.#renderObject(_problem.parameters);
		for (let obj of paramObjects) this.HTML.parameterContents.append(obj);


		let potentialTypes = _simulation.potentialTypes;
		this.renderPotential(_simulation.objects[0].potentials[0]); // TODO
	}

	#renderObject(_obj) {
		let objects = [];
		for (let key in _obj)
		{
			let value = _obj[key];

			let el = createElement('div', 'propItem');
			el.innerHTML = `<div class="propName"></div>
							<div class='propValue'><div>`
			setTextToElement(el.children[0], key);

			if (value instanceof Vector2D) {
				setTextToElement(el.children[1], 'Vec [' + value.value.join(',') + ']');
			} else if (typeof value === 'object') 
			{
				el.classList.add('object');
				let contents = this.#renderObject(value);
				for (let cont of contents) el.children[1].append(cont);
			} else {
				setTextToElement(el.children[1], value);
			}


			objects.push(el)
		}
		return objects;
	}

	renderPotential(_pot) {
		this.HTML.potentialSection.classList.toggle('hide', !_pot);
		if (_pot) this.potentialRenderer.draw(_pot);
	}
}