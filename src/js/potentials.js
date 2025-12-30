import { Vector2D } from './vector.js';

class Potential {
	static type = '';
	static isSymmetric = false;
	get type() {
		return this.constructor.type;
	}

	relPos = new Vector2D(0, 0);
	maxDist = Infinity;

	constructor({relPos_objCoords}) {
		this.relPos = relPos_objCoords;
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
	constructor({relPos_objCoords, charge}) {
		super({relPos_objCoords});
		this.charge = charge || 1;
	}

	calcPotential(_queryPos_obj) { // Assuming a positive (+1) query charge
		let delta = this.relPos.difference(_queryPos_obj);
		let dist = delta.length;

		// Todo: true equation
		return 1/dist * this.charge; // * Math.sin(delta.angle * 5);
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
		let forceMagnitude = -(dist**-2) * this.charge * _otherPot.charge; // * Math.sin(delta.angle * 5);
		let force = delta.copy()
		force.length = -forceMagnitude; // Force is -du/dx
		return force;
	}
}


export class LJPotential extends Potential {
	static isSymmetric = true;
	static type = 'LJPot';

	sigma = 1;
	epsilon = 10;
	constructor({relPos_objCoords, sigma}) {
		super({relPos_objCoords});
		this.sigma = sigma || 1;
		this.maxDist = 3 * sigma;
	}

	calcPotential(_queryPos_obj) { // Assuming a positive (+1) query charge
		let delta = this.relPos.difference(_queryPos_obj);
		let dist = delta.length;

		// Todo: true equation
		return 4 * this.epsilon * ((this.sigma / dist)**12 - (this.sigma / dist)**6)
	}
	calcForce(_queryPos_obj, _otherPot = {charge: 1}, _delta = false, _dist = false) {
		let dist = _dist;
		let delta = _delta;
		if (!_delta) 
		{
			delta = this.relPos.difference(_queryPos_obj);
			dist = delta.length;
		}

		let forceMagnitude = -4 * this.epsilon * (-12 * (this.sigma)**12 * dist**-13 + 6 * (this.sigma)**6*dist**-7);

		let force = delta.copy()
		force.length = -forceMagnitude; // Force is -du/dx
		return force;
	}
}

export const potentialTypes = [ChargePotential, LJPotential];