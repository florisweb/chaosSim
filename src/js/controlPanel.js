import { Vector2D } from './vector.js';
import { setTextToElement, createElement } from './polyfill.js';

export default class ControlPanel {
	HTML = {}
	constructor({panel}) {
		this.HTML.panel = panel;
		this.HTML.constantsContents = panel.querySelector('.section.constants .sectionContents');
		this.HTML.parameterContents = panel.querySelector('.section.parameters .sectionContents');
	}

	onProblemChange(_problem) {
		this.HTML.constantsContents.innerHTML = '';
		let constObjects = this.#renderObject(_problem.constants);
		for (let obj of constObjects) this.HTML.constantsContents.append(obj);

		this.HTML.parameterContents.innerHTML = '';
		let paramObjects = this.#renderObject(_problem.parameters);
		for (let obj of paramObjects) this.HTML.parameterContents.append(obj);
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


}