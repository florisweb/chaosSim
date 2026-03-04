import { Vector3D, Vector2D } from './vector.js';
import { SpringConnector } from './connectors.js';
import { Renderer } from './renderer.js';


export class Problem {
	name = '';
	constants = {}
	parameters = {}
	recordables = [];
	get renderer() {
		return this.customRenderer || Renderer;
	}

	constructor({parameters}) {
		this.parameters = {...this.parameters, ...parameters};
	}
	setup(simulation) {}
}




import { BucketObject, WheelObject } from './object.js';
export class ChaoticWaterWheelProblem extends Problem {
	name = 'Chaotic water wheel';
	constants = {
		wheel: {
			radius: 10,
			position: new Vector2D(20, 25)
		},
		buckets: {
			count: 10,
			size: new Vector2D(2, 2),
			wallThickness: 0.1
		},
		dynamics: {
			transFrictionScalar: 0.1,
			rotFrictionScalar: 0.1,
			springConnStiffness: 1000
		}
	}
	parameters = {
		leakSpeed: 0.01269,
		fillSpeed: 0.055,
	}

	recordables = [
		{
			name: 'angle',
			get: (_simulation) => _simulation.objects[0].angle
		}
	];


	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {
		let wheel = new WheelObject({position: this.constants.wheel.position, radius: this.constants.wheel.radius})
		simulation.objects.push(wheel);

		for (let b = 0; b < this.constants.buckets.count; b++)
		{
			let angle = b / this.constants.buckets.count * 2 * Math.PI;
			let offset = new Vector2D(this.constants.wheel.radius, 0).rotate(angle);
			
			let bucket = new BucketObject({
				position: this.constants.wheel.position.copy().add(offset).add(this.constants.buckets.size.copy().scale(-0.5)), 
				size: this.constants.buckets.size, 
				wallThickness: this.constants.buckets.wallThickness,
				leakSpeed: this.parameters.leakSpeed,
				fillSpeed: this.parameters.fillSpeed,
				transFrictionScalar: this.constants.dynamics.transFrictionScalar,
				rotFrictionScalar: this.constants.dynamics.rotFrictionScalar
			});
			wheel.connect(bucket, new SpringConnector({k: this.constants.dynamics.springConnStiffness}), offset, new Vector2D(this.constants.buckets.size.x / 2, 0));
			simulation.objects.push(bucket);
		}
	}
}


import { NodeObject, AnchorNodeObject } from './object.js';

export class BridgeProblem extends Problem {
	name = 'Bridge';
	constants = {
		elementCount: 20,
		leftPolePos: new Vector2D(10, 25),
		rightPolePos: new Vector2D(40, 20)
	}

	recordables = [
		{
			name: 'yPosCentreNode',
			get: (_simulation) => _simulation.objects[Math.floor(this.constants.elementCount / 2)].position.y
		},
		{
			name: 'yPosCentreNode2',
			get: (_simulation) => _simulation.objects[Math.floor(this.constants.elementCount / 4)].position.y
		}
	];


	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {
		let leftPole = new AnchorNodeObject({position: this.constants.leftPolePos});
		let rightPole = new AnchorNodeObject({position: this.constants.rightPolePos});
		simulation.objects.push(leftPole);
		simulation.objects.push(rightPole);

		let prevPole = leftPole;
		for (let i = 1; i < this.constants.elementCount - 1; i++)
		{
			let pos = this.constants.leftPolePos.copy().add(this.constants.leftPolePos.difference(this.constants.rightPolePos).scale(i / (this.constants.elementCount - 1)));
			let pole = new NodeObject({position: pos});
			pole.connect(prevPole, SpringConnector);
			simulation.objects.push(pole);
			prevPole = pole;
		}

		prevPole.connect(rightPole, SpringConnector);
	}
}

import { PendulumArm } from './object.js';

export class DoublePendulumProblem extends Problem {
	name = 'Double Pendulum';
	constants = {
		topBarPos: new Vector2D(20, 15),
		barSize: new Vector2D(10, 0.1)
	}

	recordables = [
		{
			name: 'topAngle',
			get: (_simulation) => _simulation.objects[0].angle
		},
		{
			name: 'bottomAngle',
			get: (_simulation) => _simulation.objects[1].angle
		}
	];


	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {
		let topPendulum = new PendulumArm({position: this.constants.topBarPos, size: this.constants.barSize, fixed: true});
		let bottomPendulum = new PendulumArm({position: this.constants.topBarPos.copy().add(this.constants.barSize), size: this.constants.barSize});
		bottomPendulum.centreOfRotation = new Vector2D(0, this.constants.barSize.y / 2);
		topPendulum.connect(bottomPendulum, SpringConnector, new Vector2D(this.constants.barSize.x, this.constants.barSize.y / 2), new Vector2D(0, this.constants.barSize.y / 2));

		simulation.objects.push(topPendulum);
		simulation.objects.push(bottomPendulum);
	}
}



import { ChargedParticle, LJParticle } from './object.js';

export class ChargePotentialProblem extends Problem {
	name = 'Charge Potential';
	
	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {
		// let particleA = new ChargedParticle({position: new Vector2D(10, 20), charge: -1});
		// let particleB = new ChargedParticle({position: new Vector2D(10, 30), charge: 1});
		// let particleC = new ChargedParticle({position: new Vector2D(19, 24), charge: -1});
		// simulation.objects.push(particleA);
		// simulation.objects.push(particleB);
		// simulation.objects.push(particleC);

		const minDist = 3;
		let posses = [];
		for (let i = 0; i < 4; i++)
		{
			let pos = new Vector2D(50, 50).multiply(new Vector2D(Math.random(), Math.random()));
			while (Math.min(...posses.map(p => p.difference(pos).length)) < minDist)
			{
				pos = new Vector2D(50, 50).multiply(new Vector2D(Math.random(), Math.random()));
			}
			posses.push(pos);
		}

		
		simulation.objects = posses.map(p => new ChargedParticle({position: p, charge: Math.random() > 0.5 ? 1 : -1}))
	}
}


export class CrystallizationProblem extends Problem {
	name = 'Particle Crystal Formation';
	
	constants = {
		grid: {
			spacing: 3,
			randomPositionVariation: 0,
			size: new Vector2D(10, 10),
		}
	}

	parameters = {
		potential: {
			period: 2 * 3,
			epsilon: 1,
		}
	}
	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {
		let spacing = this.constants.grid.spacing;
		const posVariation = this.constants.grid.randomPositionVariation;
		const period = 0; //2 * 3.5;
		for (let x = 0; x < this.constants.grid.size.x; x++)
		{
			for (let y = 0; y < this.constants.grid.size.y; y++)
			{
				let pos = new Vector2D(10 + x * spacing + Math.random() * posVariation, 10 + y * spacing + Math.random() * posVariation);
				simulation.objects.push(new LJParticle({position: pos, period: this.parameters.potential.period, epsilon: this.parameters.potential.epsilon}))
			}
		}
	}
}



import { ElecDipoleObject } from './object.js';
export class DipoleProblem extends Problem {
	name = 'Dipole Test';
	
	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {
		let dipole1 = new ElecDipoleObject({position: new Vector2D(10, 20), size: new Vector2D(5, 1), angle: Math.PI});
		let dipole2 = new ElecDipoleObject({position: new Vector2D(10, 15), size: new Vector2D(5, 1)});

		simulation.objects.push(dipole1);
		simulation.objects.push(dipole2);
	}
}





import { VoronoiRenderer } from './renderer.js';

export class VoronoiProblem extends Problem {
	name = 'Voronoi render test';
	customRenderer = VoronoiRenderer;
	
	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {
		// let particleA = new AnchorNodeObject({position: new Vector2D(10, 20)});
		// particleA.id = 'topLeft';
		// let particleB = new AnchorNodeObject({position: new Vector2D(10, 30)});
		// particleB.id = 'bottomLeft';
		// let particleC = new AnchorNodeObject({position: new Vector2D(20, 14)});
		// particleC.id = 'topRight';
		// let particleD = new AnchorNodeObject({position: new Vector2D(30, 34)});
		// particleD.id = 'bottomRight';
		// simulation.objects.push(particleA);
		// simulation.objects.push(particleB);
		// simulation.objects.push(particleC);
		// simulation.objects.push(particleD);


		let particleA = new AnchorNodeObject({position: new Vector2D(10, 20)});
		particleA.id = 'A';
		let particleD = new AnchorNodeObject({position: new Vector2D(5, 35)});
		particleD.id = 'D';
		let particleB = new AnchorNodeObject({position: new Vector2D(20, 20)});
		// let particleB = new AnchorNodeObject({position: new Vector2D(16, 25)});
		particleB.id = 'B';
		let particleC = new AnchorNodeObject({position: new Vector2D(20, 30)});
		particleC.id = 'C';
		simulation.objects.push(particleA);
		simulation.objects.push(particleB);
		simulation.objects.push(particleC);
		simulation.objects.push(particleD);

		// for (let i = 0; i < 4; i++)
		// {
		// 	let pos = new Vector2D(50, 50).multiply(new Vector2D(Math.random(), Math.random()));
		// 	let particle = new AnchorNodeObject({position: pos});
		// 	simulation.objects.push(particle);
		// }
	}
}


import { AuxeticCubeObject, AuxeticPullerObject } from './object.js';
import { ConstLenSpringConnector } from './connectors.js';
export class AuxeticMaterialProblem extends Problem {
	name = 'Auxetic Material';
	
	constants = {
		systemOffset: new Vector2D(10, 10),
		cubeSize: new Vector2D(1, 1),
		grid: {
			spacing: 1,
			size: new Vector2D(30, 20),
		}
	}

	parameters = {
		springStrength: 100,
		pullerBlockDensity: 0.1,
		connPointInMiddle: false,
	}

	recordables = [
		{
			name: 'Ey',
			get: (_simulation) => (_simulation.objects[0].position.y - (this.constants.systemOffset.y + this.constants.grid.size.y * this.constants.grid.spacing)) / (this.constants.grid.size.y * this.constants.grid.spacing),
		},
		{
			name: 'Ex',
			get: (_simulation) => (_simulation.objects[1 + this.constants.grid.size.x * Math.round(this.constants.grid.size.y / 2)].position.x - this.constants.systemOffset.x) * -2 / (this.constants.grid.size.x * this.constants.grid.spacing),
		},
		{
			name: 'Poisson\'s ratio',
			get: (_simulation) => -(_simulation.objects[1 + this.constants.grid.size.x * Math.round(this.constants.grid.size.y / 2)].position.x - this.constants.systemOffset.x) * -2 / (this.constants.grid.size.x * this.constants.grid.spacing) / ((_simulation.objects[0].position.y - (this.constants.systemOffset.y + this.constants.grid.size.y * this.constants.grid.spacing)) / (this.constants.grid.size.y * this.constants.grid.spacing)),
		}
	];


	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {
		let spacing = this.constants.grid.spacing;

		const pullerObject = new AuxeticPullerObject({
			position: this.constants.systemOffset.copy().add(new Vector2D(0, this.constants.grid.size.y * this.constants.grid.spacing)), 
			size: new Vector2D(this.constants.grid.size.copy().scale(this.constants.grid.spacing).x, 3),
			density: this.parameters.pullerBlockDensity
		});
		simulation.objects.push(pullerObject);

		let cubes = [];
		for (let y = 0; y < this.constants.grid.size.y; y++)
		{
			cubes[y] = [];
			let prevXCube;
			for (let x = 0; x < this.constants.grid.size.x; x++)
			{
				let pos = this.constants.systemOffset.copy().add(new Vector2D(x * this.constants.grid.spacing, y * this.constants.grid.spacing));
				let cube = new AuxeticCubeObject({position: pos, size: this.constants.cubeSize, fixed: y === 0})
				simulation.objects.push(cube);

				if (x > 0)
				{
					prevXCube.connect(
						cube, 
					 	new ConstLenSpringConnector({k: this.parameters.springStrength}), 
						this.parameters.connPointInMiddle ? this.constants.cubeSize.copy().scale(0.5) : new Vector2D(this.constants.cubeSize.x, x % 2 === y % 2 ? this.constants.cubeSize.y : 0), 
						this.parameters.connPointInMiddle ? this.constants.cubeSize.copy().scale(0.5) : new Vector2D(0, x % 2 === y % 2 ? this.constants.cubeSize.y : 0)
					);
				}

				if (y > 0)
				{
					let prevYCube = cubes[y - 1][x];
					prevYCube.connect(
						cube, 
						new ConstLenSpringConnector({k: this.parameters.springStrength}), 
						this.parameters.connPointInMiddle ? this.constants.cubeSize.copy().scale(0.5) : new Vector2D(y % 2 !== x % 2 ? this.constants.cubeSize.x : 0, this.constants.cubeSize.y), 
						this.parameters.connPointInMiddle ? this.constants.cubeSize.copy().scale(0.5) : new Vector2D(y % 2 !== x % 2 ? this.constants.cubeSize.x : 0, 0)
					);
				}
				if (y === this.constants.grid.size.y - 1)
				{
					cube.connect(
						pullerObject, 
						new ConstLenSpringConnector({k: this.parameters.springStrength}), 
						this.parameters.connPointInMiddle ? this.constants.cubeSize.copy().scale(0.5) : new Vector2D(y % 2 !== x % 2 ? this.constants.cubeSize.x : 0, this.constants.cubeSize.y), 
						new Vector2D(x * this.constants.grid.spacing + (this.parameters.connPointInMiddle ? this.constants.cubeSize.x/2 : (y % 2 !== x % 2 ? this.constants.cubeSize.x : 0)), 0)
					);
				}
				

				cubes[y][x] = cube;
				prevXCube = cube;
			}
		}
	}
}


import { MandelbrotRenderer} from './renderer.js';
export class MandelbrotProblem extends Problem {
	name = 'Mandelbrot set';
	customRenderer = MandelbrotRenderer;
	
	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {}
}



import { ParticleSimulation } from './simulation.js';
import { ParticleSimRenderer } from './renderer.js';
export class ParticleLifeProblem extends Problem {
	name = 'Particle-life Sim';
	customRenderer = ParticleSimRenderer;
	customSimulator = ParticleSimulation;
	
	constructor({parameters} = {}) {
		super({parameters});
	}

	setup(simulation) {
		// simulation.particleDataArr = [[0.1, 0.1, 0, 0], [0.5, 0.5, 0, 0]];
	}
}



export const availableProblems = [new ParticleLifeProblem, new MandelbrotProblem, new AuxeticMaterialProblem, new VoronoiProblem, new CrystallizationProblem, new ChaoticWaterWheelProblem, new ChargePotentialProblem, new BridgeProblem, new DoublePendulumProblem, new DipoleProblem];




