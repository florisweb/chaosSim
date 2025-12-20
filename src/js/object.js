import { Vector2D } from './vector.js';

import { RectangleGeometry } from './geometry.js' ;
import { ArmMaterial } from './material.js';
import { GravityDynamic, BottomWorldBoundDynamic } from './dynamics.js';

class Object {
	geometry;
	material;
	dynamics = [];

	position = new Vector2D(0, 0);
	velocity = new Vector2D(0, 0);
	angularVelocity = 0;
	angle = 0;

	netForce = new Vector2D(0, 0);
	netTorque = 0;

	centreOfRotation = new Vector2D(0, 0); // Relative when not rotated


	get mass() {
		return this.geometry.area * this.material.density;
	}
	get inertia() {
		return this.geometry.calcInertia(this.centreOfRotation);
	}

	constructor(_geometry, _material) {
		this.geometry = _geometry;
		this.material = _material;

		// this.n#onRotCentreOfRotation = this.geometry.relativeCentreOfMass;
		this.centreOfRotation = new Vector2D(0, 0);
	}

	addDynamic(_dynamicClass) {
		let dynamic = new _dynamicClass(this);
		this.dynamics.push(dynamic);
		this.dynamics.sort((a, b) => a.order > b.order);
	}

	calcForces(_dt, _simulation) {
		this.netForce = new Vector2D(0, 0);
		this.netTorque = 0;
		for (let dynamic of this.dynamics)
		{
			dynamic.applyForce(_dt, _simulation);
		}
	}

	applyForce(_relPosition, _force) { // _relPos: already rotated
		let delta = this.centreOfRotation.difference(_relPosition);
		let perpendicular = _force.projectOnTo(delta.perpendicular)
		let parallel = _force.projectOnTo(delta);

		// console.log(_relPosition, _force)
		this.netTorque += _force.dotProduct(delta.perpendicular);
		// this.netForce.add(parallel);
		
		App.renderer.drawVector(this.position.copy().add(_relPosition), _force.copy().scale(0.01), '#aaa');
		App.renderer.drawVector(this.position.copy().add(_relPosition), perpendicular.copy().scale(0.01), '#0f0');
		App.renderer.drawVector(this.position.copy().add(_relPosition), parallel.copy().scale(0.01), '#00f');
			// this.netTorque += subTorque;

	}



	applyNetForceConsequences(_dt) {
		let transAcc = this.netForce.copy().scale(1 / this.mass);
		this.velocity.add(transAcc.copy().scale(_dt));
		this.position.add(this.velocity.copy().scale(_dt));

		let angularAcc = this.netTorque / this.inertia;
		this.angularVelocity += angularAcc * _dt
		this.angle += this.angularVelocity * _dt

	}
}





export class ArmObject extends Object {
	constructor({position, size, angle = 0}) {
		super(new RectangleGeometry(size), new ArmMaterial);
		this.position = position;
		this.angle = angle;
		this.addDynamic(GravityDynamic);
		// this.addDynamic(BottomWorldBoundDynamic);
	}
}





