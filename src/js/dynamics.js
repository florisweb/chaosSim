import { Vector2D } from './vector.js';

class Dynamic {
	_object;
	order = 0; // Higher is later
	constructor(_object) {
		this._object = _object
	}
	calculate(_dt, _simulation) {
		// Returns [Vector2D (translation), torque (rotational)]
	}
}


export class GravityDynamic extends Dynamic {
	static g = 9.81; // m/s^2
	
	calculate(_dt) {
		let mass = this._object.mass;

		return [new Vector2D(0, 1).scale(mass * GravityDynamic.g), 0];
	}
}

export class BottomWorldBoundDynamic extends Dynamic {	
	order = 100000;
	calculate(_dt, _simulation) {
		let mass = this._object.mass;
		let dy = _simulation.size.y * 0.9 - this._object.position.y;
		if (dy > 0) return [new Vector2D(0, 0), 0];

		let reqStopForce = this._object.velocity.copy().scale(-mass / _dt);
		let netStopForce = this._object.netForce.copy().add(reqStopForce);
		netStopForce.add(new Vector2D(0, dy * 10000 * mass)); // A little compensation to prevent sinking
		return [netStopForce, 0]
	}
}