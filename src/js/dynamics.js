import { Vector2D } from './vector.js';

class Dynamic {
	_object;
	order = 0; // Higher is later
	constructor(_object) {
		this._object = _object
	}
	applyForce(_dt, _simulation) {
		// Call _object.applyForce
	}
}


export class GravityDynamic extends Dynamic {
	static g = 9.81; // m/s^2
	
	applyForce(_dt) {
		let mass = this._object.mass;

		this._object.applyForce(this._object.geometry.relativeCentreOfMass.copy().rotate(this._object.angle), new Vector2D(0, 1).scale(mass * GravityDynamic.g));
	}
}

export class BottomWorldBoundDynamic extends Dynamic {	
	order = 100000;
	applyForce(_dt, _simulation) {
		let mass = this._object.mass;
		let dy = _simulation.size.y * 0.9 - this._object.position.y;
		if (dy > 0) return;

		let reqStopForce = this._object.velocity.copy().scale(-mass / _dt);
		let netStopForce = this._object.netForce.copy().add(reqStopForce);
		netStopForce.add(new Vector2D(0, dy * 10000 * mass)); // A little compensation to prevent sinking

		this._object.applyForce(this._object.geometry.relativeCentreOfMass.copy().rotate(this._object.angle), netStopForce)
	}
}