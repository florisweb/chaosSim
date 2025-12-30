import { Vector2D, Vector3D } from './vector.js';
import App from './app.js';
// import { GPU } from 'gpu.js';
import { potentialTypes } from './potentials.js';


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
		this.updates = 0;
		this.time = 0;
	}

	potentialTypes = [];
	setup() {
		this.potentialTypes = this.#getPotentialTypes(this.objects);
	}

	#getPotentialTypes(_objects) {
		let potTypes = new Set();
		for (let obj of _objects)
		{
			let types = [];
			if (obj.isObjectGroup)
			{
				types = this.#getPotentialTypes(obj.objects);
			} else types = obj.potentials.map(p => p.constructor);

			for (let type of types) potTypes.add(type);
		}
		return [...potTypes.keys()];
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
		for (let pot of this.potentialTypes)
		{
			if (pot.isSymmetric)
			{
				for (let i = 0; i < this.objects.length; i++)
				{
					for (let j = i + 1; j < this.objects.length; j++)
					{
						for (let potI of this.objects[i].potentials)
						{
							if (potI.type != pot.type) continue;
							for (let potJ of this.objects[j].potentials)
							{
								if (potJ.type != pot.type) continue;

								let otherPotPos = this.objects[j].position.copy().add(potJ.relPos);
								let objCoords = this.objects[i].worldCoordToObjectCoord(otherPotPos);
								let delta = potI.relPos.difference(objCoords);
								let dist = delta.length;
								if (dist > potI.maxDist && dist > potJ.maxDist) continue; // Neglicable

								let force = potI.calcForce(objCoords, potJ, delta, dist);
								this.objects[i].applyForce(potI.relPos, force);
								this.objects[j].applyForce(potJ.relPos, force.copy().scale(-1));
							}
						}
					}
				}

			} else {

				for (let i = 0; i < this.objects.length; i++)
				{
					for (let j = 0; j < this.objects.length; j++)
					{
						if (i === j) continue;
						for (let potI of this.objects[i].potentials)
						{
							if (potI.type != pot.type) continue;
							for (let potJ of this.objects[j].potentials)
							{
								if (potJ.type != pot.type) continue;

								let otherPotPos = this.objects[j].position.copy().add(potJ.relPos);
								let objCoords = this.objects[i].worldCoordToObjectCoord(otherPotPos);
								let delta = potI.relPos.difference(objCoords);
								let dist = delta.length;
								if (dist > potI.maxDist && dist > potJ.maxDist) continue; // Neglicable

								let force = potI.calcForce(objCoords, potJ, delta, dist);
								this.objects[i].applyForce(potI.relPos, force);
							}
						}
					}
				}
			}
		}


		this.onUpdate();
	}

	// Hook
	onUpdate() {}
}
