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


// export class LJPotential extends Potential {
// 	static isSymmetric = true;
// 	static type = 'LJPot';

// 	sigma = 1;
// 	epsilon = 10;
// 	constructor({relPos_objCoords, sigma}) {
// 		super({relPos_objCoords});
// 		this.sigma = sigma || 1;
// 		this.maxDist = 3 * sigma;
// 	}

// 	calcPotential(_queryPos_obj) { // Assuming a positive (+1) query charge
// 		let delta = this.relPos.difference(_queryPos_obj);
// 		let dist = delta.length;

// 		// Todo: true equation
// 		return 4 * this.epsilon * ((this.sigma / dist)**12 - (this.sigma / dist)**6)
// 	}
// 	calcForce(_queryPos_obj, _otherPot = {charge: 1}, _delta = false, _dist = false) {
// 		let dist = _dist;
// 		let delta = _delta;
// 		if (!_delta) 
// 		{
// 			delta = this.relPos.difference(_queryPos_obj);
// 			dist = delta.length;
// 		}

// 		let forceMagnitude = -4 * this.epsilon * (-12 * (this.sigma)**12 * dist**-13 + 6 * (this.sigma)**6*dist**-7);

// 		let force = delta.copy()
// 		force.length = -forceMagnitude; // Force is -du/dx
// 		return force;
// 	}
// }



export class LJPeriodPotential extends Potential {
	static isSymmetric = false;
	static type = 'LJLikePot';

	sigma = 1;
	epsilon = 10;
	period = 0;
	constructor({relPos_objCoords, sigma, period}) {
		super({relPos_objCoords});
		this.sigma = sigma || 1;
		this.maxDist = 4 * sigma;
		this.period = period ;
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

		// let forceMagnitude = -4 * this.epsilon * (-12 * (this.sigma)**12 * dist**-13 + 6 * (this.sigma)**6*dist**-7) * Math.cos(delta.angle * this.period + 1 * Math.PI);
		let dudr = 4 * this.epsilon * (
			-12 * (this.sigma)**12 * dist**-13 
			+ 6 * (this.sigma)**6*dist**-7 * Math.cos(delta.angle * this.period)
		);
		let dudphi = 4 * this.epsilon * (this.sigma / dist)**6 * Math.sin(delta.angle * this.period) * this.period

		let force = delta.copy();
		force.length = -dudr; // Force is -du/dr

		let perp = delta.perpendicular;
		perp.length = -dudphi;  // -du/dphi
		force.add(perp);
		return force;
	}
}

export class LJPotential extends LJPeriodPotential {
	static isSymmetric = true;
	static type = 'LJPot';

	sigma = 1;
	epsilon = 10;
	constructor({relPos_objCoords, sigma}) {
		super({relPos_objCoords});
		this.sigma = sigma || 1;
		// this.maxDist = 4 * sigma;
	}

	calcPotential(_queryPos_obj) { // Assuming a positive (+1) query charge
		let delta = this.relPos.difference(_queryPos_obj);
		let dist = delta.length;

		return 4 * this.epsilon * ((this.sigma / dist)**12 - (this.sigma / dist)**6);
	}
	calcForce(_queryPos_obj, _otherPot = {charge: 1}, _delta = false, _dist = false) {
		let dist = _dist;
		let delta = _delta;
		if (!_delta) 
		{
			delta = this.relPos.difference(_queryPos_obj);
			dist = delta.length;
		}

		let dudr = -4 * this.epsilon * (-12 * (this.sigma)**12 * dist**-13 + 6 * (this.sigma)**6*dist**-7);		

		let force = delta.copy();
		force.length = -dudr; // Force is -du/dr
		return force;
	}
}




export const potentialTypes = [ChargePotential, LJPotential, LJPeriodPotential];