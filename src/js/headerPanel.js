import Panel from './panel.js';
import { setTextToElement } from './polyfill.js';

export default class HeaderPanel extends Panel {
	constructor({panel}, _app) {
		super({panel});
		this.HTML.problemName = panel.querySelector('.problemName');
		this.HTML.problemName.addEventListener('click', () => _app.projectSelectionPage.open());
	}

	onProblemChange(_problem) {
		setTextToElement(this.HTML.problemName, _problem?.name || '');
	}
}