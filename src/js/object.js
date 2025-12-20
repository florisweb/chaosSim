import { Vector2D } from './vector.js';

import { RectangleGeometry } from './geometry.js' ;
import { ArmMaterial } from './material.js';
import { GravityDynamic } from './dynamics.js';

class Object {
	geometry;
	material;
	dynamics = [];

	position = new Vector2D(0, 0);
	velocity = new Vector2D(0, 0);
	angle = 0;

	netForce = new Vector2D(0, 0);


	get mass() {
		return this.geometry.area * this.material.density;
	}

	constructor(_geometry, _material) {
		this.geometry = _geometry;
		this.material = _material;
	}

	addDynamic(_dynamicClass) {
		let dynamic = new _dynamicClass(this);
		this.dynamics.push(dynamic);
	}

	calcForces(_dt) {
		this.netForce = new Vector2D(0, 0);
		for (let dynamic of this.dynamics)
		{
			let subForce = dynamic.calculate(_dt);
			this.netForce.add(subForce);
		}
	}

	applyForces(_dt) {
		let transAcc = this.netForce.copy().scale(1 / this.mass);
		this.velocity.add(transAcc.copy().scale(_dt))
		this.position.add(this.velocity.copy().scale(_dt))
	}
}





export class ArmObject extends Object {
	constructor({position, size}) {
		super(new RectangleGeometry(size), new ArmMaterial);
		this.position = position;
		this.addDynamic(GravityDynamic);
	}
}





