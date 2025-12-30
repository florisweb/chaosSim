
export default class Panel {
	static panels = [];

	HTML = {};

	constructor({panel}) {
		this.HTML.panel = panel;
		Panel.panels.push(this);
	}

	setHideState(_hide) {
		this.HTML.panel.classList.toggle('hide', _hide);
		for (let panel of Panel.panels) panel.onResize();
	}


	onResize() {}
}