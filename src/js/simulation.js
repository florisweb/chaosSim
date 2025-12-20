import { Vector2D, Vector3D } from './vector.js';
import App from './app.js';
// import { GPU } from 'gpu.js';


export default class Simulation {
	size;
	world = [];
	objects = [];
	config = {
		maxDt: 0.01
	}
	

	constructor({size}) {
		this.size = size;
	}

	
	#lastUpdate = new Date();
	updates = 0;
	update() {
		this.updates++;
		let dt = Math.min((new Date() - this.#lastUpdate) / 1000, this.config.maxDt);

		for (let obj of this.objects)
		{
			obj.applyNetForceConsequences(dt);
		}
		
		for (let obj of this.objects)
		{
			obj.calcForces(dt, this);
		}

		this.#lastUpdate = new Date();
	}
}
