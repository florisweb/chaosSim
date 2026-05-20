import { Vector3D, Vector2D } from '../vector.js';
import { SpringConnector } from './connectors.js';
import { Simulation, ParticleSimulation, GridSimulation } from './simulation.js';
import { Renderer, ParticleSimRenderer, GridRenderer } from './renderer.js';

export class Problem {
	static name = '';
	static constants = {}
	parameters = {}
	static recordables = [];
	static documentation = [];
	get constants() {return this.constructor.constants}
	get recordables() {return this.constructor.recordables}

	renderer;
	simulation;

	#rendererClass;
	#simulationClass;

	// --- Sim config ---
	defaultDt = 0.02; // False = match with real time 
	maxDt = 0.02; // Only relevant if defaultDt = false


	worldSize = new Vector2D(50, 50);

	constructor({parameters, renderer = Renderer, simulation = Simulation}) {
		this.parameters = {...this.parameters, ...parameters};
		this.#rendererClass = renderer;
		this.#simulationClass = simulation;
	}
	setup({canvas}) {
		this.renderer = new this.#rendererClass({canvas, viewSize: this.worldSize});
		this.simulation = new this.#simulationClass({size: this.worldSize});
		this.simulation.config.maxDt = this.maxDt;
		this.simulation.config.defaultDt = this.defaultDt;
	}
	unLoad() {
		this.simulation.clear();
		this.renderer.unLoad();
	}
}




import { BucketObject, WheelObject } from './object.js';
export class ChaoticWaterWheelProblem extends Problem {
	static name = 'Chaotic water wheel';
	static constants = {
		wheel: {
			radius: 10,
			position: new Vector2D(15, 25)
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


	static recordables = [
		{
			name: 'angle',
			get: (_simulation) => _simulation.objects[0].angle
		}
	];
	static documentation = [
		`This simulation is designed to investigate unstable / chaotic systems. 
		The chosen system represents a water wheel with [] buckets attached, these buckets leak at a constant rate $\\xi$, and are filled at a rate $\\zeta$ when on top. 
		As described by the following formula:`,
		`$\\frac{dV}{dt} = -\\xi + \\zeta H(y - y_{ref})$`,
		`Here $H(x)$ is the Heaviside step function, which is 1 for $x \\geq 0$ values and 0 for $x < 0$. Here $y_{ref}$ represents the height after which the buckets are being filled.`
	];
	worldSize = new Vector2D(30, 50);


	constructor({parameters} = {}) {
		super({parameters});
	}

	setup() {
		super.setup(...arguments);

		let wheel = new WheelObject({position: this.constants.wheel.position, radius: this.constants.wheel.radius})
		this.simulation.objects.push(wheel);

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
			this.simulation.objects.push(bucket);
		}

		this.simulation.setup();
	}
}


import { NodeObject, AnchorNodeObject } from './object.js';

export class BridgeProblem extends Problem {
	static name = 'Bridge';
	static constants = {
		elementCount: 20,
		leftPolePos: new Vector2D(10, 25),
		rightPolePos: new Vector2D(40, 20)
	}

	static recordables = [
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

	setup() {
		super.setup(...arguments);
		let leftPole = new AnchorNodeObject({position: this.constants.leftPolePos});
		let rightPole = new AnchorNodeObject({position: this.constants.rightPolePos});
		this.simulation.objects.push(leftPole);
		this.simulation.objects.push(rightPole);

		let prevPole = leftPole;
		for (let i = 1; i < this.constants.elementCount - 1; i++)
		{
			let pos = this.constants.leftPolePos.copy().add(this.constants.leftPolePos.difference(this.constants.rightPolePos).scale(i / (this.constants.elementCount - 1)));
			let pole = new NodeObject({position: pos});
			pole.connect(prevPole, SpringConnector);
			this.simulation.objects.push(pole);
			prevPole = pole;
		}

		prevPole.connect(rightPole, SpringConnector);
		this.simulation.setup();
	}
}

import { PendulumArm } from './object.js';

export class DoublePendulumProblem extends Problem {
	static name = 'Double Pendulum';
	static constants = {
		topBarPos: new Vector2D(20, 15),
		barSize: new Vector2D(10, 0.1)
	}

	static recordables = [
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

	setup() {
		super.setup(...arguments);
		let topPendulum = new PendulumArm({position: this.constants.topBarPos, size: this.constants.barSize, fixed: true});
		let bottomPendulum = new PendulumArm({position: this.constants.topBarPos.copy().add(this.constants.barSize), size: this.constants.barSize});
		bottomPendulum.centreOfRotation = new Vector2D(0, this.constants.barSize.y / 2);
		topPendulum.connect(bottomPendulum, SpringConnector, new Vector2D(this.constants.barSize.x, this.constants.barSize.y / 2), new Vector2D(0, this.constants.barSize.y / 2));

		this.simulation.objects.push(topPendulum);
		this.simulation.objects.push(bottomPendulum);
		this.simulation.setup();
	}
}



import { ChargedParticle, LJParticle } from './object.js';

export class ChargePotentialProblem extends Problem {
	static name = 'Charge Potential';
	
	constructor({parameters} = {}) {
		super({parameters});
	}

	setup() {
		super.setup(...arguments);
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

		
		this.simulation.objects = posses.map(p => new ChargedParticle({position: p, charge: Math.random() > 0.5 ? 1 : -1}))
		this.simulation.setup();
	}
}


export class CrystallizationProblem extends Problem {
	static name = 'Particle Crystal Formation';
	
	static constants = {
		grid: {
			spacing: 3,
			randomPositionVariation: 0,
			size: new Vector2D(10, 10),
		}
	}

	parameters = {
		potential: {
			period: 2 * 2,
			epsilon: 3,
		}
	}
	static documentation = [
		`Each particle has its own potential, given by a modified Leanard Jones potential: <br>`,
		`$U(r, \\theta) = 4\\epsilon[(\\frac{\\sigma}{r})^{12} - (\\frac{\\sigma}{r})^6\\cos(n\\theta)]$<br>`,
		'With $\\theta$ the angle, $\\epsilon$ and $\\sigma$ the standard LJ-parameters and $n$ the periodicity of the potential (see rendered potential below).'
	];

	
	// --- Sim config ---
	defaultDt = 0.02;


	constructor({parameters} = {}) {
		super({parameters});
	}

	setup() {
		super.setup(...arguments);
		let spacing = this.constants.grid.spacing;
		const posVariation = this.constants.grid.randomPositionVariation;
		const period = 0; //2 * 3.5;
		for (let x = 0; x < this.constants.grid.size.x; x++)
		{
			for (let y = 0; y < this.constants.grid.size.y; y++)
			{
				let pos = new Vector2D(10 + x * spacing + Math.random() * posVariation, 10 + y * spacing + Math.random() * posVariation);
				this.simulation.objects.push(new LJParticle({position: pos, period: this.parameters.potential.period, epsilon: this.parameters.potential.epsilon}))
			}
		}
		this.simulation.setup();
	}
}



import { ElecDipoleObject } from './object.js';
export class DipoleProblem extends Problem {
	static name = 'Dipole Test';
	
	constructor({parameters} = {}) {
		super({parameters});
	}

	setup() {
		super.setup(...arguments);
		let dipole1 = new ElecDipoleObject({position: new Vector2D(10, 20), size: new Vector2D(5, 1), angle: Math.PI});
		let dipole2 = new ElecDipoleObject({position: new Vector2D(10, 15), size: new Vector2D(5, 1)});

		this.simulation.objects.push(dipole1);
		this.simulation.objects.push(dipole2);
		this.simulation.setup();
	}
}





import { VoronoiRenderer } from './renderer.js';

export class VoronoiProblem extends Problem {
	static name = 'Voronoi render test';
	
	constructor({parameters} = {}) {
		super({
			parameters,
			renderer: VoronoiRenderer,
		});
	}

	setup() {
		super.setup(...arguments);
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
		this.simulation.objects.push(particleA);
		this.simulation.objects.push(particleB);
		this.simulation.objects.push(particleC);
		this.simulation.objects.push(particleD);

		// for (let i = 0; i < 4; i++)
		// {
		// 	let pos = new Vector2D(50, 50).multiply(new Vector2D(Math.random(), Math.random()));
		// 	let particle = new AnchorNodeObject({position: pos});
		// 	simulation.objects.push(particle);
		// }
		this.simulation.setup();
	}
}


import { AuxeticCubeObject, AuxeticPullerObject } from './object.js';
import { ConstLenSpringConnector } from './connectors.js';
export class AuxeticMaterialProblem extends Problem {
	static name = 'Auxetic Material';
	
	static constants = {
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

	static recordables = [
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

	static documentation = [
		`An auxetic material is a material which has a negative poissons ratio: <br>
		$\\nu = -\\frac{d\\epsilon_y}{d\\epsilon_x} < 0$.<br>
		With $\\epsilon$ the strain (fraction of deformation with respect to original length: $\\epsilon = \\Delta L / L$).<br>
		For normal materials, if you let them hang or pull on them, they will become longer in the vertical direction ($d\\epsilon_y > 0$) while becoming thinner in the
		horizontal direction ($d\\epsilon_x < 0$). This represents a positive poissons ratio. <br>
		However, auxetic materials are a type of metamaterial which does not follow this trend, instead becoming wider while also becoming longer (see simulation). <br>
		Therefore its density decreases and its volume increases. One way to achieve this effect is through the specific folding/origami-like geometry simulated here.
		`
	];

	constructor({parameters} = {}) {
		super({parameters});
	}

	setup() {
		super.setup(...arguments);
		let spacing = this.constants.grid.spacing;

		const pullerObject = new AuxeticPullerObject({
			position: this.constants.systemOffset.copy().add(new Vector2D(0, this.constants.grid.size.y * this.constants.grid.spacing)), 
			size: new Vector2D(this.constants.grid.size.copy().scale(this.constants.grid.spacing).x, 3),
			density: this.parameters.pullerBlockDensity
		});
		this.simulation.objects.push(pullerObject);

		let cubes = [];
		for (let y = 0; y < this.constants.grid.size.y; y++)
		{
			cubes[y] = [];
			let prevXCube;
			for (let x = 0; x < this.constants.grid.size.x; x++)
			{
				let pos = this.constants.systemOffset.copy().add(new Vector2D(x * this.constants.grid.spacing, y * this.constants.grid.spacing));
				let cube = new AuxeticCubeObject({position: pos, size: this.constants.cubeSize, fixed: y === 0})
				this.simulation.objects.push(cube);

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
		this.simulation.setup();
	}
}


import { MandelbrotRenderer} from './renderer.js';
export class MandelbrotProblem extends Problem {
	static name = 'Mandelbrot set';
	
	static documentation = [
		`The Mandelbrot-set is a set which contains all points on the complex plane, of which the the following equation does not diverge: <br>
		$f_c(z) = z^2+c$<br>
		Here $c$ is the initial value, representing the point on the complex plane of which we want to know whether or not it is contained in the Mandelbrot-set, and $z_0=0$. <br>
		When iterating the function above the value of $z$ either stays bounded, or not. If it does, it belongs to the mandelbrot set, otherwise it does not and it is rendered in red.
		`
	];

	constructor({parameters} = {}) {
		super({parameters, renderer: MandelbrotRenderer});
	}

	setup(simulation) {
		super.setup(...arguments);
		this.simulation.setup();
	}
}




export class ParticleLifeProblem extends Problem {
	static name = 'Particle-life Sim';
	
	constructor({parameters} = {}) {
		super({parameters, simulation: ParticleSimulation, renderer: ParticleSimRenderer});
	}

	setup(simulation) {
		super.setup(...arguments);
		// simulation.particleDataArr = [[0.1, 0.1, 0, 0], [0.5, 0.5, 0, 0]];
		this.simulation.setup();
	}
}


export class DiffusionProblem extends Problem {
	static name = 'Cahn Hilliard Phase Seperation';

	static documentation = [
		`The Cahn Hilliard equation:<br>
		$\\partial_t\\phi = D\\nabla[\\phi \\nabla\\mu]$<br>
		with $\\mu = \\partial_\\phi F$ the chemical potential of species 1, and<br>
		$F = \\phi ln\\phi + (1-\\phi)ln(1-\\phi)+\\Chi\\phi(1-\\phi)-1/2\\kappa(\\nabla \\phi)^2$<br>
		With the first three terms the Flory Huggins free energy of mixing for a binary, monomeric system, and the last term a term to incorporate the cost of surface area.
		`
	];

	worldSize = new Vector2D(400, 400);
	// worldSize = new Vector2D(10, 10);
	// worldSize = new Vector2D(100, 100);
	
	constructor({parameters} = {}) {
		super({parameters, simulation: GridSimulation, renderer: GridRenderer});
	}

	setup(simulation) {
		super.setup(...arguments);
		this.simulation.setup();
	}
}



// export const availableProblems = [ParticleLifeProblem, MandelbrotProblem, AuxeticMaterialProblem, VoronoiProblem, CrystallizationProblem, ChaoticWaterWheelProblem, ChargePotentialProblem, BridgeProblem, DoublePendulumProblem, DipoleProblem];
export const availableProblems = [ParticleLifeProblem, DiffusionProblem, MandelbrotProblem, AuxeticMaterialProblem, CrystallizationProblem, ChaoticWaterWheelProblem, ChargePotentialProblem, BridgeProblem, DoublePendulumProblem, DipoleProblem];




