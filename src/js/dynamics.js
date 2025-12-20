import { Vector2D } from './vector.js';

class Dynamic {
	_object;
	constructor(_object) {
		this._object = _object
	}

}


export class GravityDynamic extends Dynamic {
	static g = 9.81; // m/s^2
	
	calculate(_dt) {
		let mass = this._object.mass;

		return new Vector2D(0, 1).scale(mass * GravityDynamic.g);
	}
}