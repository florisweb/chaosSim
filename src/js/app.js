import { Vector2D, Vector3D } from './vector.js';
import Simulation from './simulation.js';
import Renderer from './renderer.js';
import { ArmObject, BucketObject, AnchorObject } from './object.js';
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

		

		



		// const anchor = new AnchorObject({position: new Vector2D(20, 20)});
		// this.simulation.objects.push(anchor);

		const bucketSize = 2;
		const armSize = new Vector2D(20, 0.5);

		let bucket = new BucketObject({position: new Vector2D(20 - bucketSize / 2, 25), size: new Vector2D(bucketSize, bucketSize)});
		this.simulation.objects.push(bucket);

		let arm = new ArmObject({position: new Vector2D(20, 25), size: armSize, angle: 0})
		this.simulation.objects.push(arm);

		arm.connect(bucket, new Vector2D(0, 0), new Vector2D(bucketSize / 2, bucketSize / 2), SpringConnector);

		

		// obj.connect(bucket, new Vector2D(0, 0), bucket.centreOfRotation, SpringConnector);
		// anchor.connect(bucket, new Vector2D(0.5/2, 0.5/2), new Vector2D(0, 0), SpringConnector);
		// anchor.connect(bucket, new Vector2D(0.5/2, 0.5/2), new Vector2D(1, 1), SpringConnector);
		// bucket.connect(obj, new Vector2D(1, 0), new Vector2D(0, 0), SpringConnector);


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