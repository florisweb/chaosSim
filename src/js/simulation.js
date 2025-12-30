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
	
	clear() {
		this.objects = [];
	}
	
	#lastUpdate = new Date();
	updates = 0;
	time = 0;
	update() {
		let dt = Math.min((new Date() - this.#lastUpdate) / 1000, this.config.maxDt);
		dt = this.config.maxDt; // If this varies the simulation becomes unreliable (for chaotic systems at least)
		
		for (let i = 0; i < this.#speed; i++)
			this.#runSingleUpdate(dt);

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


		// Calculate potentials
		for (let i = 0; i < this.objects.length; i++)
		{
			for (let j = 0; j < this.objects.length; j++)
			{
				if (i === j) continue;
				for (let potI of this.objects[i].potentials)
				{
					for (let potJ of this.objects[j].potentials)
					{
						if (potI.type != potJ.type) continue;
						let otherPotPos = this.objects[j].position.copy().add(potJ.relPos);
						let force = potI.calcForce(this.objects[i].worldCoordToObjectCoord(otherPotPos), potJ);
						this.objects[i].applyForce(potI.relPos, force);
					}
				}
			}
		}

		this.onUpdate();
	}

	// Hook
	onUpdate() {}
}
