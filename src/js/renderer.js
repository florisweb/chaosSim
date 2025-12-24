import { Vector3D, Vector2D } from './vector.js';
import App from './app.js';
import { GPU } from 'gpu.js';

let ctx;

export default class Renderer {
	renderDebugInfo = false;
	canvas;

	size = new Vector2D(100, 100);
	scalar = new Vector2D(1, 1);

	curObject;

	constructor({canvas}) {
		this.canvas = canvas;
		ctx = this.canvas.getContext('2d');
		ctx.constructor.prototype.circle = function(x, y, size) {
		    if (size < 0) return;
		    this.beginPath();
		    this.ellipse(
		      x, 
		      y, 
		      size,
		      size,
		      0,
		      0,
		      2 * Math.PI
		    );
		    this.closePath();
		}


		window.onresize = () => {
			const pxScalar = 2;
			worldCanvas.width = worldCanvas.offsetWidth * pxScalar;
			worldCanvas.height = worldCanvas.offsetHeight * pxScalar;
			this.size = new Vector2D(worldCanvas.width, worldCanvas.height);
		}
		window.onresize();
	}
	
	draw(_simulation) {
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.scalar = new Vector2D(
			this.size.x / _simulation.size.x,
			this.size.y / _simulation.size.y // Negative as lower is higher in canvas-space
		);
		for (let object of _simulation.objects)
		{
			this.drawObject(object);
		}
	}


	drawObject(_object) {
		if (_object.isObjectGroup) return this.drawObjectGroup(_object);

		this.curObject = _object;
		ctx.fillStyle = _object.material.getFillStyle();

		_object.geometry.drawShape(ctx, this);
		ctx.fill();
		
		// this.drawVector(_object.objectCoordToWorldCoord(_object.centreOfRotation), new Vector2D(0, -1), '#0af');
		// this.drawVector(_object.objectCoordToWorldCoord(_object.geometry.relativeCentreOfMass), new Vector2D(0, -1), '#0fa');
		// this.drawVector(_object.position, new Vector2D(0, -1), '#fa0');
	}

	drawObjectGroup(_objectGroup) {
		for (let obj of _objectGroup.objects)
		{
			this.drawObject(obj);
		}
	}





	lineTo(_pos) {
		let pxCoords = this.curObject.objectCoordToWorldCoord(_pos).copy().multiply(this.scalar);
		ctx.lineTo(pxCoords.x, pxCoords.y)
	}
	moveTo(_pos) {
		let pxCoords = this.curObject.objectCoordToWorldCoord(_pos).copy().multiply(this.scalar);
		ctx.moveTo(pxCoords.x, pxCoords.y)
	}

	drawCircle(_pos, _rad) {
		let pxCoords = this.curObject.objectCoordToWorldCoord(_pos).copy().multiply(this.scalar);
		let pxRad = _rad * this.scalar.x;
		ctx.circle(pxCoords.x, pxCoords.y, pxRad);
	}	



	drawVector(_start, _delta, _color = '#f00') {
		let end = _start.copy().add(_delta);
		this.drawVectorTo(_start.copy().multiply(this.scalar), end.multiply(this.scalar), _color);
	}
	drawVectorTo(_start, _end, _color = '#f00') {
		ctx.strokeStyle = _color;
		ctx.beginPath();
	    ctx.moveTo(_start.x, _start.y);
	    ctx.lineTo(_end.x, _end.y);
	    ctx.closePath();
	    ctx.stroke();
	}
}




function wait(_ms) {
	return new Promise((resolve) => setTimeout(resolve, _ms));
}