import { Vector2D, Vector3D } from './vector.js';
import Simulation from './simulation.js';
import Renderer from './renderer.js';
import Recorder from './recorder.js';
import { ChaoticWaterWheelProblem, BridgeProblem, DoublePendulumProblem } from './problem.js';

import GraphPanel from './graphPanel.js';
import SimulationPanel from './simulationPanel.js';
import HeaderPanel from './headerPanel.js';
import ControlPanel from './controlPanel.js';


window.Vector2D = Vector2D;
const App = new class {
	simulation;
	renderer;
	
	availableProblems = [];
	problem;

	constructor() {
		window.App = this;

		this.availableProblems = [new ChaoticWaterWheelProblem, new BridgeProblem, new DoublePendulumProblem];

		let size = new Vector2D(50, 50);

		this.renderer = new Renderer({canvas: document.querySelector('#simulationCanvas'), simulationSize: size});
		this.simulation = new Simulation({size: size});
		this.recorder = new Recorder({recordInterval: 2});
		this.graphPanel = new GraphPanel();
		this.simulationPanel = new SimulationPanel({panel: document.querySelector('.UIPanel.simulationPanel')}, this.simulation);
		this.headerPanel = new HeaderPanel({panel: document.querySelector('.UIPanel.headerPanel')}, this);
		this.controlPanel = new ControlPanel({panel: document.querySelector('.UIPanel.controlPanel')});


		let graphUpdateTimeout;
		let graphUpdateTimeoutLength = 200;
		this.recorder.onDataChange = (_data) => {
			if (graphUpdateTimeout) return;
			graphUpdateTimeout = setTimeout(() => {
				let startTime = new Date()
				this.graphPanel.update(_data);
				let delta = new Date() - startTime;
				console.log(delta);
				graphUpdateTimeoutLength = delta**2 * 0.1;
				graphUpdateTimeout = null;
			}, graphUpdateTimeoutLength);
		}
		this.simulation.onUpdate = () => {
			this.recorder.record(this.simulation, this.problem);
		}

		this.loadProblem(this.availableProblems[0]);



		this.setup().then(() => document.body.classList.remove('loading'));
	}

	loadProblem(_problem) {
		this.simulation.clear();
		this.recorder.clear();
		this.graphPanel.clear();
		this.headerPanel.onProblemChange(_problem);
		this.controlPanel.onProblemChange(_problem);
		this.problem = _problem;
		this.problem.setup(this.simulation);
	}

	async setup() {
		this.draw();
		this.update();
	}

	draw() {
		// this.renderer.draw(this.simulation);
		requestAnimationFrame(() => this.draw());
	}

	update() {
		this.renderer.draw(this.simulation);
		this.simulation.update();
		this.simulationPanel.update(this.simulation);
		setTimeout(() => this.update(), 1);
	}
}







export default App;