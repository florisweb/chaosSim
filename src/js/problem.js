import { Vector3D, Vector2D } from './vector.js';
import { SpringConnector } from './connectors.js';
import { ArmObject, BucketObject, AnchorObject, WheelObject, TrueBucketObject } from './object.js';



export class Problem {
	name = '';
	constants = {}
	parameters = {}
	recordables = [];

	
	constructor({parameters}) {}
	setup(simulation) {}
}





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
		}
	}

	recordables = [
		{
			name: 'angle',
			get: (_simulation) => _simulation.objects[0].angle
		}
	];


	constructor({parameters}) {
		super({parameters});
	}

	setup(simulation) {
		let wheel = new WheelObject({position: this.constants.wheel.position, radius: this.constants.wheel.radius})
		simulation.objects.push(wheel);

		for (let b = 0; b < this.constants.buckets.count; b++)
		{
			let angle = b / this.constants.buckets.count * 2 * Math.PI;
			let offset = new Vector2D(this.constants.wheel.radius, 0).rotate(angle);
			let bucket = new TrueBucketObject({
				position: this.constants.wheel.position.copy().add(offset).add(this.constants.buckets.size.copy().scale(-0.5)), 
				size: this.constants.buckets.size, 
				wallThickness: this.constants.buckets.wallThickness
			});
			wheel.connect(bucket, SpringConnector, offset, new Vector2D(this.constants.buckets.size.x / 2, 0));
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


	constructor({parameters}) {
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