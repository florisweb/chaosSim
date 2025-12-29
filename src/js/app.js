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

	constructor() {
		window.App = this;
		let size = new Vector2D(50, 50);

		this.renderer = new Renderer({canvas: document.querySelector('#simulationCanvas'), simulationSize: size});
		this.simulation = new Simulation({size: size});
		this.recorder = new Recorder({recordInterval: 1});
		this.graphPanel = new GraphPanel();
		this.simulationPanel = new SimulationPanel({panel: document.querySelector('.UIPanel.simulationPanel')}, this.simulation);
		this.headerPanel = new HeaderPanel({panel: document.querySelector('.UIPanel.headerPanel')});
		this.controlPanel = new ControlPanel({panel: document.querySelector('.UIPanel.controlPanel')});


		let graphUpdateTimeout;
		this.recorder.onDataChange = (_data) => {
			if (graphUpdateTimeout) return;
			graphUpdateTimeout = setTimeout(() => {
				this.graphPanel.update(_data);
				graphUpdateTimeout = null;
			}, 200);
		}
		this.simulation.onUpdate = () => {
			this.recorder.record(this.simulation, this.problem);
		}

		// this.problem = new ChaoticWaterWheelProblem({})
		this.loadProblem(new ChaoticWaterWheelProblem());



		this.setup().then(() => document.body.classList.remove('loading'));
	}

	loadProblem(_problem) {
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
		if (this.simulation.time > 6000) return;

		this.renderer.draw(this.simulation);
	
		this.simulation.update();

		this.simulationPanel.update(this.simulation);
		setTimeout(() => this.update(), 1);
	}
}







export default App;