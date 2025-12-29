import { setTextToElement } from './polyfill.js';

export default class HeaderPanel {
	HTML = {}
	constructor({panel}) {
		this.HTML.panel = panel;
		this.HTML.problemName = panel.querySelector('.problemName');

	}

	onProblemChange(_problem) {
		setTextToElement(this.HTML.problemName, _problem?.name || '');
	}
}