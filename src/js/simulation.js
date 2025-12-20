import { Vector2D, Vector3D } from './vector.js';
import App from './app.js';
// import { GPU } from 'gpu.js';
import { ArmObject } from './object.js';


export default class Simulation {
	size;
	world = [];
	objects = [];
	config = {
		maxDt: 0.1
	}
	

	constructor({size}) {
		this.size = size;
		this.objects.push(new ArmObject({position: new Vector2D(10, 10), size: new Vector2D(10, 1)}))
	}

	
	#lastUpdate = new Date();
	updates = 0;
	update() {
		this.updates++;
		let dt = Math.min((new Date() - this.#lastUpdate) / 1000, this.config.maxDt);

		for (let obj of this.objects)
		{
			obj.calcForces(dt, this);
		}
		for (let obj of this.objects)
		{
			obj.applyForces(dt);
		}

		this.#lastUpdate = new Date();
	}
}
