import { Vector2D, Vector3D } from './vector.js';
import Simulation from './simulation.js';
import Renderer from './renderer.js';
import Recorder from './recorder.js';
import { ChaoticWaterWheelProblem, BridgeProblem}from './problem.js';
import GraphPanel from './graphPanel.js';
import SimulationPanel from './simulationPanel.js';

import { SpringConnector } from './connectors.js';

import { ArmObject, BucketObject, AnchorObject, WheelObject, TrueBucketObject } from './object.js';

window.Vector2D = Vector2D;
const App = new class {
	simulation;
	renderer;

	constructor() {
		window.App = this;
		let size = new Vector2D(50, 50);

		this.renderer = new Renderer({canvas: document.querySelector('#simulationCanvas'), simulationSize: size});
		this.simulation = new Simulation({size: size});
		this.recorder = new Recorder({recordInterval: .1});
		this.graphPanel = new GraphPanel();
		this.simulationPanel = new SimulationPanel({panel: document.querySelector('.UIPanel.simulationPanel')}, this.simulation);

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
		this.problem = new BridgeProblem({});
		this.problem.setup(this.simulation);



		// for (let i = 0; i < 4; i++)
		// {
		// 	let obj = new ArmObject({position: new Vector2D(20, 25), size: new Vector2D(20, 0.2), angle: i / 4 * Math.PI})
		// 	this.simulation.objects.push(obj);
		// }

		

		
		// const anchor = new AnchorObject({position: new Vector2D(20, 20)});
		// this.simulation.objects.push(anchor);

		// const bucketSize = 2;
		// const armSize = new Vector2D(20, 0.5);

		// let bucket1 = new BucketObject({position: new Vector2D(20 - bucketSize / 2, 25), size: new Vector2D(bucketSize, bucketSize)});
		// // this.simulation.objects.push(bucket1);

		// let bucket2 = new BucketObject({position: new Vector2D(40 - bucketSize / 2, 25), size: new Vector2D(bucketSize, bucketSize * 0.5)});
		// this.simulation.objects.push(bucket2);


		// let arm = new ArmObject({position: new Vector2D(20, 25), size: armSize, angle: 0})
		// this.simulation.objects.push(arm);

		// arm.connect(bucket1, new Vector2D(0, 0), new Vector2D(bucketSize / 2, 0), SpringConnector);
		// arm.connect(bucket2, new Vector2D(armSize.x, 0), new Vector2D(bucketSize / 2, 0), SpringConnector);

			


		// ------- WHEEL --------
		// const wheelRadius = 10;
		// const wheelCentrePos = new Vector2D(20, 25);
		// let wheel = new WheelObject({position: wheelCentrePos, radius: wheelRadius})
		// this.simulation.objects.push(wheel);


		// const bucketSize = new Vector2D(2, 2);
		// const armSize = new Vector2D(20, 0.5);



		// const bucketCount = 10;

		// for (let b = 0; b < bucketCount; b++)
		// {
		// 	let angle = b / bucketCount * 2 * Math.PI;
		// 	let offset = new Vector2D(wheelRadius, 0).rotate(angle);
		// 	let bucket = new BucketObject({position: wheelCentrePos.copy().add(offset).add(bucketSize.copy().scale(-0.5)), size: bucketSize});
		// 	wheel.connect(bucket, offset, new Vector2D(bucketSize.x / 2, 0), SpringConnector);
		// 	this.simulation.objects.push(bucket);
		// }






		// const wheelRadius = 10;
		// const wheelCentrePos = new Vector2D(20, 25);
		// let wheel = new WheelObject({position: wheelCentrePos, radius: wheelRadius})
		// this.simulation.objects.push(wheel);


		// const bucketSize = new Vector2D(2, 2);
		// const armSize = new Vector2D(20, 0.5);



		// const bucketCount = 10;

		// for (let b = 0; b < bucketCount; b++)
		// {
		// 	let angle = b / bucketCount * 2 * Math.PI;
		// 	let offset = new Vector2D(wheelRadius, 0).rotate(angle);
		// 	let bucket = new TrueBucketObject({position: wheelCentrePos.copy().add(offset).add(bucketSize.copy().scale(-0.5)), size: bucketSize, wallThickness: 0.1});
		// 	wheel.connect(bucket, SpringConnector, offset, new Vector2D(bucketSize.x / 2, 0));
		// 	this.simulation.objects.push(bucket);
		// }




		this.setup().then(() => document.body.classList.remove('loading'));
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