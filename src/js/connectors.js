import { Vector2D } from './vector.js';
import { Dynamic } from './dynamics.js';


class Connector {
	order = 0; // Higher is later
	constructor(_objA, _objB, _relConnPosA, _relConnPosB) {
		this._objA = _objA;
		this._objB = _objB;
		this._relConnPosA = _relConnPosA;
		this._relConnPosB = _relConnPosB;
	}

}

export class SpringConnector extends Connector {
	dynamicA;
	dynamicB;
	constructor(_objA, _objB, _relConnPosA, _relConnPosB) {
		super(...arguments)
		this.dynamicA = new SpringDynamic(_objA, _objB, _relConnPosA, _relConnPosB);
		this.dynamicB = new SpringDynamic(_objB, _objA, _relConnPosB, _relConnPosA);
		this.dynamicA.otherDynamic = this.dynamicB;
		this.dynamicB.otherDynamic = this.dynamicA;
	}
}


class SpringDynamic extends Dynamic {
	otherDynamic;
	k = 1000;

	constructor(_object, _other, _relConnPosSelf, _relConnPosOther) {
		super(_object);
		this._other = _other
		this.relConnPosSelf = _relConnPosSelf || this._object.centreOfRotation;
		this.relConnPosOther = _relConnPosOther || this._other.centreOfRotation;
	}

	delete(_initialCall = true) {
		if (_initialCall) this.otherDynamic.delete(false);
		this._object.dynamics = this._object.dynamics.filter(d => d != this);
	}

	applyForce(_dt, _simulation) {
		let ownPos = this._object.objectCoordToWorldCoord(this.relConnPosSelf);
		let otherPos = this._other.objectCoordToWorldCoord(this.relConnPosOther);


		let delta = ownPos.difference(otherPos);
		let force = delta.copy().scale(this.k);

		this._object.applyForce(this.relConnPosSelf, force.copy());
	}

}