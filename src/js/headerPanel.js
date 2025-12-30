import Panel from './panel.js';
import { setTextToElement } from './polyfill.js';

export default class HeaderPanel extends Panel {
	constructor({panel}, _app) {
		super({panel});
		this.HTML.problemName = panel.querySelector('.problemName');
		this.HTML.problemName.addEventListener('click', () => {
			let curProblemIndex = _app.availableProblems.findIndex(p => p === _app.problem);
			_app.loadProblem(_app.availableProblems[curProblemIndex + 1] || _app.availableProblems[0]);
		})

	}

	onProblemChange(_problem) {
		setTextToElement(this.HTML.problemName, _problem?.name || '');
	}
}