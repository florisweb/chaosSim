import { Vector2D } from './vector.js';

class Potential {
	static type = '';
	static isSymmetric = false;
	get type() {
		return this.constructor.type;
	}

	relPos = new Vector2D(0, 0);
	maxDist = Infinity;

	constructor({relPos_objCoords}, _object) {
		this.relPos = relPos_objCoords;
		this._object = _object;
	}

	calcPotential(_queryPos_obj) {
		return 0;
	}
	calcForce(_queryPos_obj, _otherPot) {
		return new Vector2D(0, 0);
	}	
}




export class ChargePotential extends Potential {
	static type = 'ChargePot';
	static isSymmetric = true;

	charge = 1; // 1 = positive
	constructor({relPos_objCoords, charge}, _object) {
		super({relPos_objCoords}, _object);
		this.charge = charge || 1;
	}

	calcPotential(_queryPos_obj) { // Assuming a positive (+1) query charge
		let delta = this.relPos.difference(_queryPos_obj);
		let dist = delta.length;

		// Todo: true equation
		return 1/dist * this.charge;
	}
	calcForce(_queryPos_obj, _otherPot = {charge: 1}, _delta = false, _dist = false) {
		let dist = _dist;
		let delta = _delta;
		if (!_delta) 
		{
			delta = this.relPos.difference(_queryPos_obj);
			dist = delta.length;
		}

		// Todo: true equation
		let forceMagnitude = -(dist**-2) * this.charge * _otherPot.charge;
		let force = delta.copy()
		force.length = -forceMagnitude;
		return force;
	}
}



export class LJPeriodPotential extends Potential {
	static isSymmetric = false;
	static type = 'LJLikePot';

	sigma = 1;
	epsilon = 1;
	period = 0;

	constructor({relPos_objCoords, sigma, period, epsilon}, _object) {
		super({relPos_objCoords}, _object);
		this.sigma = sigma || 1;
		this.epsilon = epsilon || 1;
		this.maxDist = 3 * sigma;
		this.period = period;
	}

	calcPotential(_queryPos_obj) { // Assuming a positive (+1) query charge
		let delta = this.relPos.difference(_queryPos_obj);
		let dist = delta.length;

		return 4 * this.epsilon * (
			(this.sigma / dist)**12
			 - (this.sigma / dist)**6 * Math.cos(delta.angle * this.period)
		)
	}
	calcForce(_queryPos_obj, _otherPot = {charge: 1}, _delta = false, _dist = false) {
		let dist = _dist;
		let delta = _delta;
		if (!_delta) 
		{
			delta = this.relPos.difference(_queryPos_obj);
			dist = delta.length;
		}

		let angle = delta.angle;
		let dudr = 4 * this.epsilon * (
			-12 * (this.sigma)**12 * dist**-13 
			+ 6 * (this.sigma)**6*dist**-7 * Math.cos(angle * this.period)
		);
		let dudphi = 4 * this.epsilon * (this.sigma / dist)**6 * Math.sin(angle * this.period) * this.period

		let force = delta.copy();
		force.length = -dudr; // Force is -du/dr

		let perp = delta.perpendicular;
		perp.length = -dudphi;  // -du/dphi
		force.add(perp);

		// Force is in this object's coords -> rotate it back to world-coords
		return force.rotate(-this._object.angle);
	}
}

export class LJPotential extends LJPeriodPotential {
	static isSymmetric = false;
	static type = 'LJPot';

	epsilon = 10;
	constructor({relPos_objCoords, sigma}, _object) {
		super({relPos_objCoords, sigma: sigma, period: 0}, _object);
	}
}




export const potentialTypes = [ChargePotential, LJPotential, LJPeriodPotential];