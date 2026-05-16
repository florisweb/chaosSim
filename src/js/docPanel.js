import katex from 'katex';
import Panel from './panel.js';
import { createElement } from './polyfill.js';


export default class DocumentationPanel extends Panel {
	constructor({panel}) {
		super(...arguments);
		this.HTML.docContents = panel.querySelector('.contentHolder');
	}

	onProblemChange(_problem) {
		this.#renderDocumentation(_problem.constructor.documentation);
		this.setHideState(_problem.constructor.documentation.length === 0);
	}

	#renderDocumentation(_docs) {
		this.HTML.docContents.innerHTML = '';

		for (let row of _docs)
		{
			let elem = createElement('div', 'katexWrapper');

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

			this.HTML.docContents.append(elem);
		}
	}
}