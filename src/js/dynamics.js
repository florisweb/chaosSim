import { Vector2D } from './vector.js';

export class Dynamic {
	_object;
	order = 0; // The order describes when the dynamic is applied in the evaluation chain, with higher order being later
	constructor(_object) {
		this._object = _object
	}
	applyForce(_dt, _simulation) {
		// Call _object.applyForce
	}
}


export class GravityDynamic extends Dynamic {
	g = 9.81 // m/s^2

	constructor(_object, {g} = {}) {
		super(_object);
		if (g) this.g = g;
	}
	
	applyForce(_dt) {
		this._object.applyForce(
			this._object.geometry.relativeCentreOfMass, 
			new Vector2D(0, 1).scale(this._object.mass * this.g)
		);
	}
}

export class BottomWorldBoundDynamic extends Dynamic {	
	order = 100000;
	applyForce(_dt, _simulation) {
		let mass = this._object.mass;
		let dy = _simulation.size.y * 0.9 - this._object.position.y;
		if (dy > 0) return;

		let reqStopForce = this._object.velocity.copy().scale(-mass / _dt);
		let netStopForce = this._object.netForce.copy().add(reqStopForce);
		netStopForce.add(new Vector2D(0, dy * 10000 * mass)); // A little compensation to prevent sinking

		this._object.applyForce(this._object.geometry.relativeCentreOfMass.copy().rotate(this._object.angle), netStopForce)
	}
}

export class WorldBoundDynamic extends Dynamic {
	order = 100000;
	elasticity = 1;
	applyForce(_dt, _simulation) {
		let mass = this._object.mass;


		let reqStopForce = this._object.velocity.copy().scale(-mass / _dt);

		let force = new Vector2D(0, 0);
		let padding = 0.1;
		if (this._object.position.x < padding || this._object.position.x > _simulation.size.x - padding)
		{
			force.x += reqStopForce.x * (1 + this.elasticity);
		}
		if (this._object.position.y < padding || this._object.position.y > _simulation.size.y - padding)
		{
			force.y += reqStopForce.y * (1 + this.elasticity);
		}

		this._object.applyForce(this._object.relativeCentreOfMass, force)
	}
}



export class TransFrictionDynamic extends Dynamic {
	scalar = .02;
	constructor(_object, _scalar) {
		super(_object);
		if (_scalar) this.scalar = _scalar;
	}

	applyForce(_dt, _simulation) {
		this._object.applyForce(this._object.centreOfRotation, this._object.velocity.copy().scale(-this.scalar * this._object.mass));
	}
}

export class RotFrictionDynamic extends Dynamic {
	scalar = .1;
	constructor(_object, _scalar) {
		super(_object);
		if (_scalar) this.scalar = _scalar;
	}
	
	applyForce(_dt, _simulation) {
		this._object.netTorque += this._object.angularVelocity * -this.scalar * this._object.inertia;
	}
}

