import { Vector2D } from './vector.js';

class Geometry {
	get area() {
		return 1
	}
	get relativeCentreOfMass() {
		return new Vector2D(0, 0)
	}
	calcInertia(_centreOfRotation) {

	}

	constructor() {

	}


	draw(_ctx) {

	}
}



export class RectangleGeometry {
	diagonal;
	get area() {
		return this.diagonal.x * this.diagonal.y;
	}
	get relativeCentreOfMass() {
		return this.diagonal.copy().scale(0.5);
	}

	calcInertia(_centreOfRotation) {
		let rotCentreOffset = this.relativeCentreOfMass.difference(_centreOfRotation);
		let rotCentreDist = rotCentreOffset.length;
		// Assuming centreOfRotation is relativeCentreOfGravity


		let inertia = (this.diagonal.x * this.diagonal.y**3) / 12;
		return inertia + rotCentreDist**2 * this.area;
	}



	constructor(_diagonal) {
		this.diagonal = _diagonal;
	}

	drawShape(ctx, _position, _angle, _centreOfRotation, scalar) {
		let topLeft = _centreOfRotation.copy().scale(-1).rotate(_angle).add(_position).multiply(scalar);
		let topRight = new Vector2D(
			this.diagonal.x - _centreOfRotation.x,
			-_centreOfRotation.y,
		).rotate(_angle).add(_position).multiply(scalar);
		let bottomRight = new Vector2D(
			this.diagonal.x - _centreOfRotation.x,
			this.diagonal.y - _centreOfRotation.y,
		).rotate(_angle).add(_position).multiply(scalar);;
		let bottomLeft = new Vector2D(
			-_centreOfRotation.x,
			this.diagonal.y - _centreOfRotation.y,
		).rotate(_angle).add(_position).multiply(scalar);;

		ctx.beginPath();
		ctx.moveTo(topLeft.x, topLeft.y);
		ctx.lineTo(topRight.x, topRight.y);
		ctx.lineTo(bottomRight.x, bottomRight.y);
		ctx.lineTo(bottomLeft.x, bottomLeft.y);
		ctx.closePath();


		// ctx.beginPath();
		// ctx.moveTo((_position.x) * scalar.x, 					_position.y * scalar.y);
		// ctx.lineTo((_position.x + this.diagonal.x) * scalar.x, 	_position.y * scalar.y);
		// ctx.lineTo((_position.x + this.diagonal.x) * scalar.x, 	(_position.y + this.diagonal.y) * scalar.y);
		// ctx.lineTo((_position.x) * scalar.x, 					(_position.y + this.diagonal.y) * scalar.y);
		// ctx.closePath();
	}
}