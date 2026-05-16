import { Vector2D, Vector3D } from './vector.js';
import Recorder from './simulation/recorder.js';
import { availableProblems } from './simulation/problem.js';

import { SimulationPage, ProjectSelectionPage } from './page.js';

window.Vector2D = Vector2D;
const App = new class {
	get simulation() {
		return this.problem?.simulation;
	}
	get renderer() {
		return this.problem?.renderer;
	}
	
	availableProblems = [];
	problem;

	config = {
		renderer: {
			renderPotType: ''
		}
	}

	constructor() {
		window.App = this;

		this.availableProblems = availableProblems;
		
		this.recorder = new Recorder({recordInterval: 2});

		this.simulationPage = new SimulationPage({HTML: document.querySelector('.page.simulator')}, this);
		this.projectSelectionPage = new ProjectSelectionPage({HTML: document.querySelector('.page.projectSelection')}, this);

		
		let graphUpdateTimeout;
		let graphUpdateTimeoutLength = 200;
		this.recorder.onDataChange = (_data) => {
			if (graphUpdateTimeout) return;
			graphUpdateTimeout = setTimeout(() => {
				let startTime = new Date()
				this.simulationPage.graphPanel.update(_data);
				let delta = new Date() - startTime;
				graphUpdateTimeoutLength = delta**1.5 * 0.1;
				graphUpdateTimeout = null;
			}, graphUpdateTimeoutLength);
			// TODO should also reset graphUpdateTimeoutLength back to 200
		}


		this.setup().then(() => document.body.classList.remove('loading'));
	}

	loadProblem(_problemClass) {
		if (this.problem) this.problem.unLoad();
		this.recorder.clear();

		this.problem = new _problemClass();
		this.problem.setup({canvas: document.querySelector('#simulationCanvas')});
		this.problem.simulation.onUpdate = () => {
			this.recorder.record(this.simulation, this.problem);
		}
		
		this.simulationPage.onProblemChange(this.problem);

		this.update();
	}

	async setup() {
		this.projectSelectionPage.open();
		this.draw();
		this.update();

		if (window.location.hash)
		{
			let problem = this.availableProblems.find((p) => p.name === decodeURI(window.location.hash.substr(1)));
			if (problem) this.simulationPage.open(problem);
		}
	}


	async draw() {
		if (this.renderer && this.simulationPage.isOpen) await this.renderer.draw(this.simulation, this.config.renderer);
		requestAnimationFrame(() => this.draw());
	}

	async update() {
		if (!this.problem) return;
		
		this.simulation.update();
		this.simulationPage.simulationPanel.update(this.simulation);
		setTimeout(() => this.update(), 1);
	}
}







export default App;