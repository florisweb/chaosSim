import { Vector2D } from './vector.js';

class Geometry {
	get area() {
		return 1
	}
	get relativeCentreOfGravity() {
		return new Vector2D(0, 0)
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
	get relativeCentreOfGravity() {
		return this.diagonal.copy().scale(0.5);
	}


	constructor(_diagonal) {
		this.diagonal = _diagonal;
	}

	drawShape(ctx, _position, scalar) {
		ctx.beginPath();
		ctx.moveTo((_position.x) * scalar.x, 					_position.y * scalar.y);
		ctx.lineTo((_position.x + this.diagonal.x) * scalar.x, 	_position.y * scalar.y);
		ctx.lineTo((_position.x + this.diagonal.x) * scalar.x, 	(_position.y + this.diagonal.y) * scalar.y);
		ctx.lineTo((_position.x) * scalar.x, 					(_position.y + this.diagonal.y) * scalar.y);
		ctx.closePath();
	}
}