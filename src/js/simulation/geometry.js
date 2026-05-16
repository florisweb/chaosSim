import { Vector2D } from '../vector.js';

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

	drawShape(ctx, renderer) {
		// Renderer: methods using object space (relative to its origin)
		ctx.beginPath();
		renderer.moveTo(new Vector2D(0, 0));
		renderer.lineTo(new Vector2D(this.diagonal.x, 0));
		renderer.lineTo(new Vector2D(this.diagonal.x, this.diagonal.y));
		renderer.lineTo(new Vector2D(0, this.diagonal.y));
		ctx.closePath();
	}
}



export class CircleGeometry {
	radius;
	arms = 1;

	get area() {
		return 2 * Math.PI * this.radius**2;
	}
	get relativeCentreOfMass() {
		return new Vector2D(0, 0)
	}

	calcInertia(_centreOfRotation) {
		let rotCentreOffset = this.relativeCentreOfMass.difference(_centreOfRotation);
		let rotCentreDist = rotCentreOffset.length;

		let inertia = Math.PI / 4 * this.radius**4;
		return inertia + rotCentreDist**2 * this.area;
	}



	constructor(_radius) {
		this.radius = _radius;
	}

	drawShape(ctx, renderer) {
			
		// Renderer: methods using object space (relative to its origin)
		renderer.moveTo(new Vector2D(0, 0));
		renderer.drawCircle(new Vector2D(0, 0), this.radius);

		ctx.closePath();
	}
}