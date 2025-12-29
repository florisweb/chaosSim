import { Vector2D } from './vector.js';

import { RectangleGeometry, CircleGeometry } from './geometry.js' ;
import { ArmMaterial, BucketMaterial, WaterMaterial } from './material.js';
import { GravityDynamic, BottomWorldBoundDynamic, TransFrictionDynamic, RotFrictionDynamic } from './dynamics.js';

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
	get relativeCentreOfMass() {
		return this.geometry.relativeCentreOfMass;
	}

	constructor(_geometry, _material) {
		this.geometry = _geometry;
		this.material = _material;
	}

	connect(_other, _connectorClass, _relConnPosSelf, _relConnPosOther) {
		let conn = new _connectorClass(this, _other, _relConnPosSelf, _relConnPosOther);
		this.dynamics.push(conn.dynamicA);
		_other.dynamics.push(conn.dynamicB);
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
		if (!this.#positionPinned) this.netForce.add(_force_worldCoords); // Correct?


		let perpendicular = _force_worldCoords.projectOnTo(delta_worldCoords.perpendicular)
		App.renderer.drawVector(
			this.objectCoordToWorldCoord(_pos_objectCoords),
			_force_worldCoords.copy().scale(.01), '#555');

		App.renderer.drawVector(
			this.objectCoordToWorldCoord(_pos_objectCoords),
			perpendicular.copy().scale(0.01), '#fff');
	}

	customUpdate() {

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



export class ObjectGroup extends Object {
	/*
		The position of an object in an objectgroup is its relative position to the position of that objectgroup.
	*/


	isObjectGroup = true;

	get mass() {
		return this.objects.map(r => r.mass).reduce((a, b) => a + b, 0) || 0;
	}
	get inertia() {
		let inertia = 0;
		for (let obj of this.objects)
		{	
			let rotCentreOffset = this.relativeCentreOfMass.difference(obj.relPosInGroup);
			let rotCentreDist = rotCentreOffset.length;
			inertia += obj.inertia + rotCentreDist**2 * obj.geometry.area;
		}


		return inertia;
	}

	get relativeCentreOfMass() {
		let totalMass = this.mass;
		let relCentreOfMass = new Vector2D(0, 0);
		for (let obj of this.objects)
		{
			relCentreOfMass.add(obj.relativeCentreOfMass.copy().scale(obj.mass / totalMass));
		}

		return relCentreOfMass;
	}


	objects = [];
	constructor(_objects) {
		super();
		for (let obj of _objects) 
		{
			if (!obj.relPosInGroup) obj.relPosInGroup = new Vector2D(0, 0);
		}

		this.objects = _objects;
		for (let obj of this.objects)
		{
			obj.applyForce = (_pos_objectCoords, _force_worldCoords) => {
				let pos_objectCoordsInGroup = _pos_objectCoords; // TOOD
				this.applyForce(pos_objectCoordsInGroup, _force_worldCoords);
			}

			let prevObjectCoordToWorldCoord = obj.objectCoordToWorldCoord;
			obj.objectCoordToWorldCoord = (_vec2d) => {
				let coord = prevObjectCoordToWorldCoord.call(obj, _vec2d);
				return this.objectCoordToWorldCoord(coord);
			}
		}


		this.centreOfRotation = this.relativeCentreOfMass;
	}


	calcForces(_dt, _simulation) {
		this.netForce = new Vector2D(0, 0);
		this.netTorque = 0;

		for (let obj of this.objects)
		{
			obj.calcForces(_dt, _simulation);
		}

		for (let dynamic of this.dynamics)
		{
			dynamic.applyForce(_dt, _simulation);
		}
	}
}





















export class TrueBucketObject extends ObjectGroup {
	#waterObject;
	#leakSpeed;
	#fillSpeed;
	constructor({position, size, wallThickness, leakSpeed, fillSpeed}) {
		let left = new BucketWallObject({position: new Vector2D(0, 0), size: new Vector2D(wallThickness, size.y - wallThickness)});
		let bottom = new BucketWallObject({position: new Vector2D(0, size.y - wallThickness), size: new Vector2D(size.x, wallThickness)});
		let right = new BucketWallObject({position: new Vector2D(size.x - wallThickness, 0), size: new Vector2D(wallThickness, size.y - wallThickness)});
		let water = new BucketWaterObject({position: new Vector2D(wallThickness, 0), size: new Vector2D(size.x - wallThickness * 2, size.y - wallThickness)});

		super([bottom, left, right, water]);
		this.#waterObject = water;
		this.#leakSpeed = leakSpeed;
		this.#fillSpeed = fillSpeed;

		this.position = position;
		this.centreOfRotation = this.relativeCentreOfMass;
		this.addDynamic(RotFrictionDynamic);
		this.addDynamic(TransFrictionDynamic);
	}

	get fullPerc() {
		return this.#waterObject.fullPerc;
	}
	set fullPerc(_perc) {
		this.#waterObject.fullPerc = _perc;
	}

	customUpdate(_dt) {
		this.fullPerc -= this.#leakSpeed * _dt;
		// if (this.angle > Math.PI * 0.5 && this.angle < Math.PI * 1.5) this.fullPerc -= 0.5 * _dt;

		if (this.position.y > 17) return;
		this.fullPerc += this.#fillSpeed * _dt;
	}
}



export class BucketWallObject extends Object {
	constructor({position, size, angle = 0}) {
		super(new RectangleGeometry(size), new BucketMaterial);
		this.position = position;
		this.angle = angle;
		
		this.addDynamic(GravityDynamic);
	}
}




export class BucketWaterObject extends Object {
	#fullPerc = 1;
	#size;
	#initialPosition;
	get fullPerc() {
		return this.#fullPerc;
	}
	set fullPerc(_perc) {
		this.#fullPerc = Math.max(Math.min(_perc, 1), 0);
		this.geometry.diagonal = new Vector2D(this.#size.x, this.#size.y * this.#fullPerc);
		this.position = this.#initialPosition.copy().add(new Vector2D(0, this.#size.y * (1 - this.#fullPerc)))
	}

	constructor({position, size, angle = 0}) {
		super(new RectangleGeometry(size), new WaterMaterial);
		this.#size = size;
		this.#initialPosition = position;
		this.position = position;
		this.angle = angle;
		this.addDynamic(GravityDynamic);
	}
}











export class WheelObject extends Object {
	constructor({position, radius}) {
		super(new CircleGeometry(radius), new ArmMaterial);
		this.position = position;
		
		this.addRotationPin(new Vector2D(0, 0));

		this.addDynamic(GravityDynamic);
		// this.addDynamic(RotFrictionDynamic);
		// this.addDynamic(BottomWorldBoundDynamic);
	}
}

export class BucketObject extends Object {
	constructor({position, size, angle = 0}) {
		super(new RectangleGeometry(size), new BucketMaterial);
		this.position = position;
		this.angle = angle;
		
		// this.centreOfRotation = new Vector2D(size.x / 2, 0);
		// this.addRotationPin(new Vector2D(0, 0));

		this.addDynamic(GravityDynamic);
		this.addDynamic(TransFrictionDynamic);
		this.addDynamic(RotFrictionDynamic);
	}
}

export class ArmObject extends Object {
	constructor({position, size, angle = 0}) {
		super(new RectangleGeometry(size), new ArmMaterial);
		this.position = position;
		this.angle = angle;
		

		// this.addDynamic(GravityDynamic);
		this.addRotationPin(size.copy().scale(.33));
		// this.addDynamic(RotFrictionDynamic);
		// this.addDynamic(BottomWorldBoundDynamic);
	}
}




export class AnchorObject extends Object {
	constructor({position, angle = 0}) {
		const size = new Vector2D(0.5, 0.5);
		super(new RectangleGeometry(size), new ArmMaterial);
		this.position = position;
		this.addRotationPin(size.copy().scale(0.5));
	}
}





export class NodeObject extends Object {
	constructor({position}) {
		const radius = 0.5;
		super(new CircleGeometry(radius), new ArmMaterial);
		this.position = position;
		this.addDynamic(GravityDynamic);
		this.addDynamic(TransFrictionDynamic);
	}
}


export class AnchorNodeObject extends NodeObject {
	constructor({position}) {
		super(...arguments);
		this.addRotationPin(new Vector2D(0, 0));
	}
}




export class PendulumArm extends Object {
	constructor({position, size, fixed = false}) {
		super(new RectangleGeometry(size), new ArmMaterial);
		this.position = position;
		
		this.addDynamic(GravityDynamic);
		this.addDynamic(RotFrictionDynamic);
		if (fixed) this.addRotationPin(new Vector2D(0, size.y/2));
	}
}
