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
	}
}


class SpringDynamic extends Dynamic {
	k = 10;
	constructor(_object, _other, _relConnPosSelf, _relConnPosOther) {
		super(_object);
		this._other = _other
		this.relConnPosSelf = _relConnPosSelf;
		this.relConnPosOther = _relConnPosOther;
	}

	applyForce(_dt, _simulation) {
		let ownPos = this._object.centreOfRotation.difference(this.relConnPosSelf)
					 .rotate(this._object.angle).add(this._object.centreOfRotation).add(this._object.position);

		let otherPos = this._other.centreOfRotation.difference(this.relConnPosOther)
					 .rotate(this._other.angle).add(this._other.centreOfRotation).add(this._other.position);
		
		// App.renderer.drawVector(ownPos.copy(), new Vector2D(0, 1), '#aaa');
		// App.renderer.drawVector(otherPos.copy(), new Vector2D(0, 1), '#00f');

		let delta = ownPos.difference(otherPos);
		let force = delta.copy().scale(this.k);

		this._object.applyForce(this.relConnPosSelf, force.copy());
		this._other.applyForce(this.relConnPosOther, force.copy().scale(-1));

		App.renderer.drawVector(ownPos, delta.copy().scale(0.5), '#f00');
	}

}