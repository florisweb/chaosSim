import { Vector2D, Vector3D } from './vector.js';
import App from './app.js';
import { potentialTypes } from './potentials.js';


export default class Simulation {
	size;
	world = [];
	objects = [];
	config = {
		maxDt: 0.02
	}
	#speed = 0;
	

	constructor({size}) {
		this.size = size;
	}

	setSpeed(_speed) {
		this.#speed  = _speed;
	}
	get running() {
		return this.#speed > 0;
	}
	
	clear() {
		this.objects = [];
		this.updates = 0;
		this.time = 0;
		this.#lastRelSpeedUpdate = new Date();
		this.#lastRelSpeedTime = 0;
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
	getDynamicTypes(_objects) {
		let dymTypes = new Set();
		for (let obj of _objects)
		{
			let types = [];
			if (obj.isObjectGroup)
			{
				types = this.getDynamicTypes(obj.objects);
			} else types = obj.dynamics.map(p => p.constructor);

			for (let type of types) dymTypes.add(type);
		}
		return [...dymTypes.keys()];
	}


	
	#lastUpdate = new Date();
	updates = 0;
	time = 0;

	relativeSpeed = 0; // World time / real time

	#lastRelSpeedUpdate = new Date();
	#lastRelSpeedTime = 0;
	update() {
		let trueDt = (new Date() - this.#lastUpdate) / 1000;
		let dt = Math.min(trueDt, this.config.maxDt);
		dt = this.config.maxDt; // If this varies the simulation becomes unreliable (for chaotic systems at least)
		
		for (let i = 0; i < this.#speed; i++)
			this.#runSingleUpdate(dt);

		this.#lastUpdate = new Date();


		if (new Date() - this.#lastRelSpeedUpdate < 1 * 200) return; // Update every 1s
		this.relativeSpeed = (this.time - this.#lastRelSpeedTime) / (new Date() - this.#lastRelSpeedUpdate) * 1000;
		this.#lastRelSpeedUpdate = new Date();
		this.#lastRelSpeedTime = this.time;
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
		

		// Calc forces from dynamics
		for (let obj of this.objects)
		{
			obj.calcForces(_dt, this);
		}

		
		this.#calculatePotentials(_dt);
		this.onUpdate();
	}



	#calculatePotentials(_dt) {
		for (let pot of this.potentialTypes)
		{
			if (pot.isSymmetric && false)
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

								// Effect of potential J on object I
								let potPos = this.objects[i].objectCoordToWorldCoord(potI.relPos);
								let objCoords = this.objects[j].worldCoordToObjectCoord(potPos);
								let delta = potJ.relPos.difference(objCoords);
								let dist = delta.length;
								if (dist > potI.maxDist && dist > potJ.maxDist) continue; // Neglicable

								let force = potJ.calcForce(objCoords, potI, delta, dist);
								this.objects[i].applyForce(potI.relPos, force);
								this.objects[j].applyForce(objCoords, force.copy().scale(-1)); // Newtons second law
							}
						}
					}
				}
			}
		}


	}



	#updatePotentials_gpu(_dt) {
		potKernels['ChargePot'] = gpu.createKernel(function(_positions, _charges, _posLength, _arrSize, _viewSize) {
		// All position units in perc (0-1)
		const channels = 4;
		let index = this.thread.x;
		let arrX = (index % (_arrSize[0] * channels)) / channels;
		let arrY = Math.floor((index / channels - arrX) / _arrSize[1]);

		let channel = index % channels;
		let x = arrX / _arrSize[0];
		let y = arrY / _arrSize[1];



		let sum = 0;
		for (let i = 0; i < _posLength; i++)
		{
			let dx = _positions[i][0] - x;
			let dy = _positions[i][1] - y;
			let distance = Math.sqrt(dx**2 + dy**2) * _viewSize[0]; // Convert unitary units to world units
	
			// Todo: true equation
			let potVal = 1 / distance * _charges[i];
			sum += potVal;
		}

		let normPot = sum;
		let r = Math.min(normPot > 0 ? normPot * 255 : 0, 255);
		let b = Math.min(normPot < 0 ? -normPot * 255 : 0, 255);
		
		let color = [r, 0, b, 125]
	    return color[channel];
	}).setOutput([config.pxOutputSize[0] * config.pxOutputSize[1] * 4]);
	}

	// Hook
	onUpdate() {}
}
