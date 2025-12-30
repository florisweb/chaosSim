import { Vector2D } from './vector.js';

class Potential {
	type = '';
	relPos = new Vector2D(0, 0);

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
	type = 'ChargePot';

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
	calcForce(_queryPos_obj, _otherPot) { // Assuming a positive (+1) query charge
		let delta = this.relPos.difference(_queryPos_obj);
		let dist = delta.length;

		// Todo: true equation

		let forceMagnitude = -(dist**-2) * this.charge * _otherPot.charge;
		let force = delta.copy()
		force.length = -forceMagnitude; // Force is -du/dx
		return force;
	}
}