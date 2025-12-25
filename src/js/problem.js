import { Vector3D, Vector2D } from './vector.js';
import { SpringConnector } from './connectors.js';
import { ArmObject, BucketObject, AnchorObject, WheelObject, TrueBucketObject } from './object.js';



export class Problem {
	name = '';
	constants = {}
	parameters = {}

	
	constructor({parameters}) {

	}


	setup(simulation) {

	}



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
				size: bucketSize, 
				wallThickness: wallThickness
			});
			wheel.connect(bucket, offset, new Vector2D(this.constants.buckets.size.x / 2, 0), SpringConnector);
			simulation.objects.push(bucket);
		}
	}
}