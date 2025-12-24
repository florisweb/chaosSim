import { Vector2D } from './vector.js';

import { RectangleGeometry } from './geometry.js' ;
import { ArmMaterial, BucketMaterial } from './material.js';
import { GravityDynamic, BottomWorldBoundDynamic } from './dynamics.js';

class Object {
	geometry;
	material;
	dynamics = [];
	constraints = [];

	position = new Vector2D(0, 0);
	velocity = new Vector2D(0, 0);
	angularVelocity = 0;
	angle = 0;

	netForce = new Vector2D(0, 0);
	netTorque = 0;

	centreOfRotation = new Vector2D(0, 0); // Position relative to position, in WORLD coords

	get mass() {
		return this.geometry.area * this.material.density;
	}
	get inertia() {
		return this.geometry.calcInertia(this.centreOfRotation);
	}

	constructor(_geometry, _material) {
		this.geometry = _geometry;
		this.material = _material;

		this.centreOfRotation = this.geometry.relativeCentreOfMass;
	}

	connect(_other, _relConnPosSelf, _relConnPosOther, _connectorClass) {
		let conn = new _connectorClass(this, _other, _relConnPosSelf, _relConnPosOther);
		this.dynamics.push(conn.dynamicA);
		// _other.dynamics.push(conn.dynamicB);
	}


	addDynamic(_dynamicClass) {
		let dynamic = new _dynamicClass(this);
		this.dynamics.push(dynamic);
		this.dynamics.sort((a, b) => a.order > b.order);
	}

	#positionPinned = false;
	addRotationPin(_relPos) {
		this.centreOfRotation = _relPos;
		this.#positionPinned = true;
	}

	calcForces(_dt, _simulation) {
		this.netForce = new Vector2D(0, 0);
		this.netTorque = 0;
		for (let dynamic of this.dynamics)
		{
			dynamic.applyForce(_dt, _simulation);
		}
	}

	applyForce(_pos_objectCoords, _force_worldCoords) {

		let delta = _pos_objectCoords.difference(this.centreOfRotation); // this.centreOfRotation.difference(_pos_objectCoords); // Relative to centre of rotation (object space)
		let delta_worldCoords = delta.copy().rotate(-this.angle);




		this.netTorque += _force_worldCoords.dotProduct(delta_worldCoords.perpendicular);
		if (!this.#positionPinned) this.netForce.add(_force); // Correct?


		let perpendicular = _force_worldCoords.projectOnTo(delta_worldCoords.perpendicular)
		App.renderer.drawVector(
			this.objectCoordToWorldCoord(_pos_objectCoords),
			_force_worldCoords.copy().scale(.01), '#555');

		App.renderer.drawVector(
			this.objectCoordToWorldCoord(_pos_objectCoords),
			perpendicular.copy().scale(0.01), '#fff');
	}



	applyNetForceConsequences(_dt) {
		let transAcc = this.netForce.copy().scale(1 / this.mass);
		this.velocity.add(transAcc.copy().scale(_dt));
		this.position.add(this.velocity.copy().scale(_dt));


		let angularAcc = this.netTorque / this.inertia;
		this.angularVelocity += angularAcc * _dt
		this.angle += this.angularVelocity * _dt


		// App.renderer.drawVector(this.position.copy().add(this.centreOfRotation.copy()), new Vector2D(0, -5), '#fa0');
		// App.renderer.drawVector(this.position.copy(), new Vector2D(0, -5), '#af0');

	}




	// --- Transformations ---
	worldCoordToObjectCoord(_vec2d) {
		let deltaFromCentre_world = _vec2d.subtract(this.position).subtract(this.centreOfRotation);
		let deltaFromCentre_object = deltaFromCentre_world.copy().rotate(this.angle);
		return deltaFromCentre_object.add(this.centreOfRotation);
	}

	objectCoordToWorldCoord(_vec2d) {
		let deltaFromCentre_object = _vec2d.copy().subtract(this.centreOfRotation);
		let deltaFromCentre_world = deltaFromCentre_object.copy().rotate(-this.angle);
		return deltaFromCentre_world.copy().add(this.centreOfRotation).add(this.position);
	}
}





export class ArmObject extends Object {
	constructor({position, size, angle = 0}) {
		super(new RectangleGeometry(size), new ArmMaterial);
		this.position = position;
		this.angle = angle;
		

		this.addDynamic(GravityDynamic);
		this.addRotationPin(size.copy().scale(0));
		// this.addDynamic(BottomWorldBoundDynamic);
	}
}


export class BucketObject extends Object {
	constructor({position, size, angle = 0}) {
		super(new RectangleGeometry(size), new BucketMaterial);
		this.position = position;
		this.angle = angle;
		// this.addDynamic(GravityDynamic);
		// this.centreOfRotation = new Vector2D(size.x / 2, 0);
		// this.addRotationPin(new Vector2D(0, 0));
	}
}

export class AnchorObject extends Object {
	constructor({position, angle = 0}) {
		super(new RectangleGeometry(new Vector2D(0.5, 0.5)), new ArmMaterial);
		this.position = position;
		this.addRotationPin(new Vector2D(0.5/2, 0.5/2));
	}
}



