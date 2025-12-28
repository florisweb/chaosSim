import { Vector2D, Vector3D } from './vector.js';
import App from './app.js';
// import { GPU } from 'gpu.js';


export default class Simulation {
	size;
	world = [];
	objects = [];
	config = {
		maxDt: 0.02
	}
	#speed = 1;
	

	constructor({size}) {
		this.size = size;
	}

	setSpeed(_speed) {
		this.#speed  = _speed;
	}

	
	#lastUpdate = new Date();
	updates = 0;
	time = 0;
	update() {
		let dt = Math.min((new Date() - this.#lastUpdate) / 1000, this.config.maxDt);
		
		for (let i = 0; i < this.#speed * 2; i++)
			this.#runSingleUpdate(dt / 2);

		this.#lastUpdate = new Date();
	}

	#runSingleUpdate(_dt) {
		this.updates++;

		this.time += _dt;
		for (let obj of this.objects)
		{
			obj.customUpdate(_dt);
		}

		for (let obj of this.objects)
		{
			obj.applyNetForceConsequences(_dt);
		}
		
		for (let obj of this.objects)
		{
			obj.calcForces(_dt, this);
		}
		this.onUpdate();
	}

	// Hook
	onUpdate() {}
}
