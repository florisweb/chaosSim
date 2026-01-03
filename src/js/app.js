import { Vector2D, Vector3D } from './vector.js';
import Simulation from './simulation.js';
import Renderer from './renderer.js';
import Recorder from './recorder.js';
import { availableProblems } from './problem.js';

import GraphPanel from './graphPanel.js';
import SimulationPanel from './simulationPanel.js';
import HeaderPanel from './headerPanel.js';
import ControlPanel from './controlPanel.js';


import { SimulationPage, ProjectSelectionPage } from './page.js';


window.Vector2D = Vector2D;
const App = new class {
	simulation;
	renderer;
	
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

		let size = new Vector2D(50, 50);

		this.renderer = new Renderer({canvas: document.querySelector('#simulationCanvas'), viewSize: size});
		this.simulation = new Simulation({size: size});
		this.recorder = new Recorder({recordInterval: 2});
		this.graphPanel = new GraphPanel({panel: document.querySelector('.UIPanel.graphPanel')});
		this.simulationPanel = new SimulationPanel({panel: document.querySelector('.UIPanel.simulationPanel')}, this.simulation, this);
		this.headerPanel = new HeaderPanel({panel: document.querySelector('.UIPanel.headerPanel')}, this);
		this.controlPanel = new ControlPanel({panel: document.querySelector('.UIPanel.controlPanel')});

		this.simulationPage = new SimulationPage({HTML: document.querySelector('.page.simulator')}, this);
		this.projectSelectionPage = new ProjectSelectionPage({HTML: document.querySelector('.page.projectSelection')}, this);

		

		let graphUpdateTimeout;
		let graphUpdateTimeoutLength = 200;
		this.recorder.onDataChange = (_data) => {
			if (graphUpdateTimeout) return;
			graphUpdateTimeout = setTimeout(() => {
				let startTime = new Date()
				this.graphPanel.update(_data);
				let delta = new Date() - startTime;
				graphUpdateTimeoutLength = delta**1.5 * 0.1;
				graphUpdateTimeout = null;
			}, graphUpdateTimeoutLength);
		}
		this.simulation.onUpdate = () => {
			this.recorder.record(this.simulation, this.problem);
		}



		this.setup().then(() => document.body.classList.remove('loading'));
	}

	loadProblem(_problem) {
		this.simulation.clear();
		this.recorder.clear();
		this.graphPanel.clear();
		this.problem = _problem;
		this.problem.setup(this.simulation);
		this.simulation.setup();
		this.graphPanel.onProblemChange(_problem);
		this.headerPanel.onProblemChange(_problem);
		this.controlPanel.onProblemChange(_problem, this.simulation);
		this.simulationPanel.onProblemChange(_problem, this.simulation);
		this.update();
	}

	async setup() {
		this.projectSelectionPage.open();
		this.draw();
		this.update();
	}



	async draw() {
		await this.renderer.draw(this.simulation, this.config.renderer);
		requestAnimationFrame(() => this.draw());
	}

	async update() {
		if (!this.problem) return;
		// await this.renderer.draw(this.simulation, this.config.renderer);
		
		this.simulation.update();
		this.simulationPanel.update(this.simulation);
		setTimeout(() => this.update(), 1);
	}
}







export default App;