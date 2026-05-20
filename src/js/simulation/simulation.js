import { Vector2D, Vector3D } from '../vector.js';
import App from '../app.js';
import { potentialTypes } from './potentials.js';
import { GPU } from 'gpu.js';
const gpu = new GPU();

class BaseSimulation {
	size = new Vector2D(0, 0);
	config = {
		maxDt: 0, // Only relevant if defaultDt = false
		defaultDt: false, // False = match with real time (note that this makes the simulation unreliable with regards to reproducability), otherwise use this dt for every time-step
	}
	#speed = 0;
	time = 0;
	updates = 0;

	#lastUpdate = new Date();
	updates = 0;
	time = 0;

	get gpu() {
		return gpu;
	}

	get running() {
		return this.#speed > 0;
	}

	constructor({size}) {
		this.size = size;
	}

	setSpeed(_speed) {
		this.#speed  = _speed;
	}


	clear() {
		this.updates = 0;
		this.time = 0;
		this.#lastRelSpeedUpdate = new Date();
		this.#lastRelSpeedTime = 0;
	}
	
	setup() {}


	relativeSpeed = 0; // World time / real time

	#lastRelSpeedUpdate = new Date();
	#lastRelSpeedTime = 0;
	update() {
		let trueDt = (new Date() - this.#lastUpdate) / 1000;
		let dt = Math.min(trueDt, this.config.maxDt);
		if (this.config.defaultDt) dt = this.config.defaultDt;
		
		if (this.#speed < 1)
		{
			this.runSingleUpdate(dt * this.#speed);
		} else {
			for (let i = 0; i < this.#speed; i++)
				this.runSingleUpdate(dt);
		}

		this.#lastUpdate = new Date();


		if (new Date() - this.#lastRelSpeedUpdate < 1 * 200) return; // Update every 1s
		this.relativeSpeed = (this.time - this.#lastRelSpeedTime) / (new Date() - this.#lastRelSpeedUpdate) * 1000;
		this.#lastRelSpeedUpdate = new Date();
		this.#lastRelSpeedTime = this.time;
	}

	runSingleUpdate(_dt) {
		this.updates++;
		this.time += _dt;
	};	
}



export class Simulation extends BaseSimulation {
	objects = [];
	
	
	clear() {
		super.clear();
		this.objects = [];
	}

	potentialTypes = [];
	setup() {
		super.setup();
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


	
	

	runSingleUpdate(_dt) {
		super.runSingleUpdate(_dt);
		
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



export class ParticleSimulation extends BaseSimulation {

	// Normalized from 0 - 1
	particleVelPosDataArr = []; // [[x1, y1, vx1, vy1]...] 
	particleConstDataArr = []; // [type1, type2]
	updateOnGPU;

	constructor() {
		super(...arguments);
		this.config.particleSize = 0.005;

		// this.particleDataArr = [[0.2, 0.1, 0, 0], [0.1, 0.1, 0, 0]];
		// this.particleDataArr = [[0.2, 0.1, 0.1, 0]];

		for (let i = 0; i < 1000; i++)
		{
			let pos = [Math.random(), Math.random()];
			let distSquared = Math.min(...this.particleVelPosDataArr.map(r => (r[0] - pos[0])**2 + (r[1] - pos[1])**2));
			let attempts = 100;
			while (distSquared < (this.config.particleSize * 2 * 2)**2 && attempts > 0)
			{
				pos = [Math.random(), Math.random()];
				distSquared = Math.min(...this.particleVelPosDataArr.map(r => (r[0] - pos[0])**2 + (r[1] - pos[1])**2));
				attempts--;
			}
			if (attempts < 0) {
				console.warn('Could not find a spot for a new particle: stopping at particle: ' + i);
				break;
			}
			this.particleVelPosDataArr.push([...pos, 0, 0]);
			this.particleConstDataArr.push([Math.floor(Math.random() * 3)]);
		}

		// Change interactions to have the same shape when repelling as attracting - also make them longer ranged
		this.updateOnGPU = gpu.createKernel(function(_data, _metaData, _arrSize, _dt) {
			const frictionFactor = 0.05;
			const maxVelocity = 0.05;
			const maxInteractionRangeSquared = 1**2;

			const maxParticleCount = 1000;
			const sigma = 0.005 * 2; // Excluded size = 2 * particleRadius
			const epsilonMatrix = [ // epsilonMatrix[ownType][otherType]
				[0.005, 0.002, 0.0005],
				[0.002, 0.005, 0.002],
				[0.002, 0.002, 0.005],
			];
			// const epsilonMatrix = [ // epsilonMatrix[ownType][otherType]
			// 	[0.002, 0.001, 0.0002],
			// 	[0.001, 0.002, 0.001],
			// 	[0.001, 0.001, 0.002],
			// ];
			const interactionModifiedMatrix = [
				[1, 1, 1],
				[1, 1, 1],
				[-1, 1, 1],
			];


			const index = this.thread.x;
			const invMass = 0.1; // 1/m
			let force = [0, 0];
			const x = _data[index][0];
			const y = _data[index][1];
			const type = _metaData[index][0];
			// if (type === 0) return [_data[index][0], _data[index][1], _data[index][2], _data[index][3]];

			for (let i = 0; i < maxParticleCount; i++)
			{
				if (i === index || i >= _arrSize) continue;
				let dx = _data[i][0] - x;
				let dy = _data[i][1] - y;
				if (dx > 0.5) {
					dx = dx - 1;
				} else if (dx < -0.5) dx = 1 + dx;
				if (dy > 0.5) {
					dy = dy - 1;
				} else if (dy < -0.5) dy = 1 + dy;

				const distSquared = dx**2 + dy**2;
				if (distSquared > maxInteractionRangeSquared) continue;
				const dist = Math.sqrt(distSquared);
				const epsilon = epsilonMatrix[type][_metaData[i][0]];
				const intModifier = interactionModifiedMatrix[type][_metaData[i][0]];

				// let forceMagnitude = 1 / dist * 0.0002; // Pure attractive

				// Leanards Jones
				const rawForceMagnitude = 4 * epsilon * (
					-12 * (sigma)**12 * dist**-13 
					+ intModifier * 6 * (sigma)**6*dist**-7
				);

				const appliedScalar = Math.min(rawForceMagnitude / dist, 5);
				force[0] += dx * appliedScalar;
				force[1] += dy * appliedScalar;
			}


			const newVelocity = [
				_data[index][2] * (1 - frictionFactor * _dt) + force[0] * invMass * _dt,
				_data[index][3] * (1 - frictionFactor * _dt) + force[1] * invMass * _dt
			];

			if (newVelocity[0] > maxVelocity) 
			{
				newVelocity[0] = maxVelocity;
			} else if (newVelocity[0] < -maxVelocity)  {
				newVelocity[0] = -maxVelocity;
			}
			if (newVelocity[1] > maxVelocity) 
			{
				newVelocity[1] = maxVelocity;
			} else if (newVelocity[1] < -maxVelocity)  {
				newVelocity[1] = -maxVelocity;
			}

			const newPos = [
				x + newVelocity[0] * _dt,
				y + newVelocity[1] * _dt,
			];

			if (newPos[0] < 0) {
				newPos[0] += 1;
			} else if (newPos[0] > 1) {
				newPos[0] -= 1;
			}
			if (newPos[1] < 0) {
				newPos[1] += 1;
			} else if (newPos[1] > 1) {
				newPos[1] -= 1;
			}

			return [
				newPos[0],
				newPos[1],
				newVelocity[0],
				newVelocity[1]
			];
		}).setOutput([this.particleVelPosDataArr.length]);
	}


	runSingleUpdate(_dt) {
		super.runSingleUpdate(_dt);
		this.particleVelPosDataArr = this.updateOnGPU(this.particleVelPosDataArr, this.particleConstDataArr, this.particleVelPosDataArr.length, _dt);
	};	
}







export class GridSimulation extends BaseSimulation {
	dataGrid = [];
	updateOnGPU;

	stateTexture;

	constructor() {
		super(...arguments);


		// let dataGrid = [];
		
		// for (let y = 0; y < this.size.y; y++)
		// {
		// 	dataGrid[y] = [];
		// 	for (let x = 0; x < this.size.x; x++)
		// 	{
		// 		dataGrid[y][x] = [];

		// 		for (let p = 0; p < phis; p++)
		// 		{
		// 			// dataGrid[p][y][x] = p === 0 ? (0.5 + (0.01 - 2 * Math.random() * 0.01)) : 0;
		// 			// dataGrid[y][x][p] = y/this.size.y * 0.5 + x/this.size.x * 0.5;
		// 			dataGrid[y][x][p] = y/this.size.y * 0.5;
		// 			// dataGrid[p][y][x] =
		// 			// 	p === 0 ? (
		// 			// 	 	0.3 + ((x-this.size.x/2)**2 + (y-this.size.y/2)**2 < 3**2 ? (0.01 - 2 * Math.random() * 0.01) : 0)
		// 			// 	) : 0;
		// 			// dataGrid[y][x] = 0.5;
		// 		}
		// 	}
		// }
	
			// const initKernel = gpu.createKernel(function (arr) { return arr[this.thread.z][this.thread.y][this.thread.x]; })
		//   .setOutput([this.size.x, this.size.y, phis])
		//   .setPipeline(true);
		// // this.stateTexture = initKernel(dataGrid);



		const phis = 3;
		const createInitialTexture = gpu.createKernel(function (width, height, phis) { 
			// Note GPU-coords are upside down: ie, low y at the bottom

			let x = this.thread.x / (width - 1);
			let y = this.thread.y / (height - 1);
			let z = this.thread.z / (phis - 1);
			return (0.5 + (0.01 - 2 * Math.random() * 0.01));
		})
		  .setOutput([this.size.x, this.size.y, phis])
		  .setPipeline(true);
		// Defining size: x, y, z
		// Indexing this.stateTexture[z][y][x]

		
		this.stateTexture = createInitialTexture(this.size.x, this.size.y, phis)		



		function chemPotKernel(_grid, _size, _params) {
			const x = this.thread.x;
			const y = this.thread.y;
			const chi = _params[1];
			const gridSpacing = 1;
			const kappa = _params[2];
			
			const p = this.thread.z;
			const phi = _grid[p][y][x];
			const phiN = y > 0 				? _grid[p][y - 1][x] : _grid[p][_size[1] - 1][x];
			const phiE = x < _size[0] - 1 	? _grid[p][y][x + 1] : _grid[p][y][0];
			const phiS = y < _size[1] - 1 	? _grid[p][y + 1][x] : _grid[p][0][x];
			const phiW = x > 0 				? _grid[p][y][x - 1] : _grid[p][y][_size[0] - 1];

			const dphidxx = (phiE - 2 * phi + phiW) / (gridSpacing**2);
			const dphidyy = (phiS - 2 * phi + phiN) / (gridSpacing**2);

			const mu = (1 + Math.log(phi)) - (1 + Math.log(1 - phi)) + chi * (1 - 2 * phi) - kappa * (dphidxx + dphidyy);
			return mu;
		}


		this.calcMu = gpu.createKernel(chemPotKernel)
			.setOutput([this.size.x, this.size.y, phis])
			.setPipeline(true)
			.setImmutable(true);


		this.updateOnGPU = gpu.createKernel(function(_grid, _muGrid, _size, _params, _dt) {
			const x = this.thread.x;
			const y = this.thread.y;
			const D = _params[0];
			const gridSpacing = 1;
			const p = this.thread.z;

			const phi = _grid[p][y][x];
			const phiN = y > 0 				? _grid[p][y - 1][x] : _grid[p][_size[1] - 1][x];
			const phiE = x < _size[0] - 1 	? _grid[p][y][x + 1] : _grid[p][y][0];
			const phiS = y < _size[1] - 1 	? _grid[p][y + 1][x] : _grid[p][0][x];
			const phiW = x > 0 				? _grid[p][y][x - 1] : _grid[p][y][_size[0] - 1];

			const mu = _muGrid[p][y][x];
			const muN = y > 0 				? _muGrid[p][y - 1][x] : _muGrid[p][_size[1] - 1][x];
			const muE = x < _size[0] - 1 	? _muGrid[p][y][x + 1] : _muGrid[p][y][0];
			const muS = y < _size[1] - 1 	? _muGrid[p][y + 1][x] : _muGrid[p][0][x];
			const muW = x > 0 				? _muGrid[p][y][x - 1] : _muGrid[p][y][_size[0] - 1];


			const dphidx = (phiE - phiW) / (2 * gridSpacing);
			const dphidy = (phiS - phiN) / (2 * gridSpacing);
			const ddmudxx = (muE - 2 * mu + muW) / (gridSpacing**2);
			const ddmudyy = (muS - 2 * mu + muN) / (gridSpacing**2);

			const dmudx = (muE - muW) / (2 * gridSpacing);
			const dmudy = (muS - muN) / (2 * gridSpacing);

			let dPhidt = D * (dphidx + dphidy) * (dmudx + dmudy) + D * phi * (ddmudxx + ddmudyy);

			return phi + dPhidt * _dt;
		})
			.setOutput([this.size.x, this.size.y, phis])
			.setPipeline(true)
			.setImmutable(true);
	}


	runSingleUpdate(_dt) {
		super.runSingleUpdate(_dt);
		const parameters = {
			D: 3,
			chi: 2.3,
			kappa: 0.5
		}

		let muTexture = this.calcMu(this.stateTexture, this.size.value, Object.values(parameters));
		let newStateTexture = this.updateOnGPU(this.stateTexture, muTexture, this.size.value, Object.values(parameters), _dt);
		muTexture.delete();
		this.stateTexture.delete();
		this.stateTexture = newStateTexture;
	};	
}

