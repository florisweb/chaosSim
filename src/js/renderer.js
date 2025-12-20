import { Vector3D, Vector2D } from './vector.js';
import App from './app.js';
import { GPU } from 'gpu.js';

let ctx;

export default class Renderer {
	renderDebugInfo = false;
	canvas;

	size = new Vector2D(100, 100);
	scalar = new Vector2D(1, 1);

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
			worldCanvas.width = worldCanvas.offsetWidth;
			worldCanvas.height = worldCanvas.offsetHeight;
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
		ctx.fillStyle = _object.material.getFillStyle();

		_object.geometry.drawShape(ctx, _object.position, this.scalar);
		ctx.fill();
	}

	drawVector(_start, _delta, _color = '#f00') {
		let end = _start.copy().add(_delta);
		this.drawVectorTo(_start, end, _color);
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