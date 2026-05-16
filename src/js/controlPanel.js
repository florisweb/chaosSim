import katex from 'katex';

import Panel from './panel.js';

import { Vector2D } from './vector.js';
import { setTextToElement, createElement } from './polyfill.js';
import { PotentialRenderer } from './renderer.js';


export default class ControlPanel extends Panel {
	constructor({panel}) {
		super(...arguments);
		this.HTML.docContents = panel.querySelector('.section.documentation .sectionContents');
		this.HTML.constantsContents = panel.querySelector('.section.constants .sectionContents');
		this.HTML.parameterContents = panel.querySelector('.section.parameters .sectionContents');
		this.HTML.potentialSection = panel.querySelector('.section.potentials'); 
		this.HTML.potentialCanvas = panel.querySelector('.section.potentials .potentialCanvas');

		this.potentialRenderer = new PotentialRenderer({canvas: this.HTML.potentialCanvas, viewSize: new Vector2D(5, 5 / 1.5)});
	}

	onResize() {
		this.potentialRenderer.onResize();
	}

	onProblemChange(_problem) {
		this.HTML.constantsContents.innerHTML = '';
		let constObjects = this.#renderObject(_problem.constructor.constants);
		for (let obj of constObjects) this.HTML.constantsContents.append(obj);

		this.HTML.parameterContents.innerHTML = '';
		let paramObjects = this.#renderObject(_problem.parameters);
		for (let obj of paramObjects) this.HTML.parameterContents.append(obj);


		this.#renderDocumentation(_problem.constructor.documentation);	

		let potentialTypes = _problem.simulation.potentialTypes;
		if (!potentialTypes?.length) return;
		this.renderPotential(_problem.simulation.objects[0].potentials[0]); // TODO
	}

	#renderDocumentation(_docs) {
		this.HTML.docContents.innerHTML = '';

		for (let row of _docs)
		{
			let elem = document.createElement('div');
			elem.classList.add('katexWrapper');

			let parts = row.split('$');
			for (let p = 0; p < parts.length; p++)
			{
				let html = parts[p];
				if (p % 2 == 1)
				{
					html = katex.renderToString(parts[p], {
					    throwOnError: false
					});
				}
				elem.innerHTML += html;
			}





			// katex.render(row, elem, {
			//     throwOnError: false
			// });
			// var html = katex.renderToString(row, {
			//     throwOnError: false
			// });
			// elem.innerHTML = html;

			this.HTML.docContents.append(elem);
		}
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