import { Vector2D, Vector3D } from './vector.js';
import Simulation from './simulation.js';
import Renderer from './renderer.js';
import { ArmObject, BucketObject } from './object.js';
import { SpringConnector } from './connectors.js';

window.Vector2D = Vector2D;
const App = new class {
	simulation;
	renderer;

	constructor() {
		window.App = this;
		let size = new Vector2D(50, 50);

		this.renderer = new Renderer({canvas: document.querySelector('#worldCanvas')});
		this.simulation = new Simulation({size: size});

		// for (let i = 0; i < 4; i++)
		// {
		// 	let obj = new ArmObject({position: new Vector2D(20, 25), size: new Vector2D(20, 0.2), angle: i / 4 * Math.PI})
		// 	this.simulation.objects.push(obj);
		// }
		const bucketSize = 2;
		let obj = new ArmObject({position: new Vector2D(20, 25), size: new Vector2D(20, 0.2), angle: 0})
		this.simulation.objects.push(obj);

		let bucket = new BucketObject({position: new Vector2D(20 - bucketSize / 2, 25), size: new Vector2D(bucketSize, bucketSize)});
		this.simulation.objects.push(bucket);

		obj.connect(bucket, new Vector2D(0, 0), bucket.centreOfRotation, SpringConnector);

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
		// for (let i = 0; i < 20; i++) 
		this.renderer.draw(this.simulation);
		this.simulation.update();
		setTimeout(() => this.update(), 1);
	}
}







export default App;