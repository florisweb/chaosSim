import { Vector3D, Vector2D } from './vector.js';
import App from './app.js';
import { GPU } from 'gpu.js';
const gpu = new GPU();

class BaseRenderer {
	canvas;

	size = new Vector2D(100, 100);
	viewSize = new Vector2D(0, 0);
	scalar = new Vector2D(1, 1);
	ctx;

	constructor({canvas, viewSize}) {
		this.canvas = canvas;
		this.viewSize = viewSize;
		this.ctx = this.canvas.getContext('2d');
		this.ctx.constructor.prototype.circle = function(x, y, size) {
		    if (size <= 0) return;
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


		window.onresize = () => this.onResize();
		this.onResize();
	}

	onResize() {
		const pxScalar = 2;
		this.canvas.width = this.canvas.offsetWidth * pxScalar;
		this.canvas.height = this.canvas.offsetHeight * pxScalar;
		this.size = new Vector2D(this.canvas.width, this.canvas.height);

		this.scalar = new Vector2D(
			this.size.y / this.viewSize.y, // [use same scalar as x for non-squased graph]  // this.size.x / simulationSize.x
			this.size.y / this.viewSize.y // [use same scalar as x for non-squased graph]  // 
		);
	}
	
	draw() {}
}

export default class Renderer extends BaseRenderer {
	curObject;
	
	#potKernel;
	#flattenDataKernel;
	#potResulution = 1; // 2x2 'pixels' - must be integer
	constructor({canvas, viewSize}) {
		super(...arguments);

		let scalar = this.scalar.scale(1 / this.#potResulution);
		let kernelOutputSize = new Vector2D(Math.ceil(this.viewSize.x * scalar.x), Math.ceil(this.viewSize.y * scalar.y))
		// this.#potKernel = gpu.createKernel(function(_positions, _posLength, _arrSize, _viewSize) {
		// 	const sigma = 0.5 * 2 * 1.5 / _viewSize[0]; // In perc
		// 	const epsilon = 10;
		// 	const period = 2 * 5;

		// 	// All position units in perc (0-1)
		// 	let x = this.thread.y / _arrSize[0];
		// 	let y = this.thread.x / _arrSize[1];

		// 	let sum = 0;

		// 	for (let i = 0; i < _posLength; i++)
		// 	{
		// 		let dx = _positions[i][0] - x;
		// 		let dy = _positions[i][1] - y;
		// 		let distance = Math.sqrt(dx**2 + dy**2);
		// 		let angle = Math.atan2(dy, dx);

		// 		let potVal = 4 * epsilon * (
		// 			(sigma / distance)**12 - (sigma / distance)**6 * Math.cos(angle * period)
		// 		);

		// 		sum += potVal;
		// 	}
		// 	let normPot = sum;
		// 	let r = Math.min(normPot > 0 ? normPot * 255 : 0, 255);
		// 	let b = Math.min(normPot < 0 ? -normPot * 255 : 0, 255);

		//     return [r, 0, b];
		// }).setOutput(kernelOutputSize.value);


		this.#potKernel = gpu.createKernel(function(_positions, _sigmas, _periods, _posLength, _arrSize, _viewSize) {
			const epsilon = 10;

			// All position units in perc (0-1)
			const channels = 4;
			let index = this.thread.x;
			let arrX = (index % (_arrSize[0] * channels)) / channels;
			let arrY = Math.floor((index / channels - arrX) / _arrSize[1]);

			let channel = index % channels;
			let x = arrX / _arrSize[0];
			let y = arrY / _arrSize[1];

			let sum = 0;
			for (let i = 0; i < _posLength; i++)
			{
				const sigma = _sigmas[i] / _viewSize[0]; // In perc
				let dx = _positions[i][0] - x;
				let dy = _positions[i][1] - y;
				let distance = Math.sqrt(dx**2 + dy**2);
				let angle = Math.atan2(dy, dx);

				let potVal = 4 * epsilon * (
					(sigma / distance)**12 - (sigma / distance)**6 * Math.cos(angle * _periods[i])
				);

				sum += potVal;
			}

			let normPot = sum / 2;
			let r = Math.min(normPot > 0 ? normPot * 255 : 0, 255);
			let b = Math.min(normPot < 0 ? -normPot * 255 : 0, 255);
			
			let color = [r, 0, b, 125]
		    return color[channel];
		}).setOutput([kernelOutputSize.value[0] * kernelOutputSize.value[1] * 4]);



		// this.#flattenDataKernel = gpu.createKernel(function(_data, _size, _resolution) {
		// 	const channels = 4;
		// 	let index = this.thread.x;
		// 	let x = index % (_size[0] * channels);
		// 	let y = Math.floor((index / channels - x) / _size[1]);
		// 	let channel = index % channels;

		// 	if (channel === 3) return 255;
		//     return _data[x][y][channel];
		// }).setOutput([kernelOutputSize.x * kernelOutputSize.y * 4 * this.#potResulution**2]);
	}
	
	draw(_simulation, _renderConfig) {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if (_renderConfig.renderPotType) this.drawPotentialsOfType(_simulation.objects, _renderConfig.renderPotType);

		for (let object of _simulation.objects)
		{
			this.drawObject(object);
		}
	}


	drawObject(_object) {
		if (_object.isObjectGroup) return this.drawObjectGroup(_object);

		this.curObject = _object;
		this.ctx.fillStyle = _object.material.getFillStyle();

		_object.geometry.drawShape(this.ctx, this);
		this.ctx.fill();
		
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
		this.ctx.lineTo(pxCoords.x, pxCoords.y)
	}
	moveTo(_pos) {
		let pxCoords = this.curObject.objectCoordToWorldCoord(_pos).copy().multiply(this.scalar);
		this.ctx.moveTo(pxCoords.x, pxCoords.y)
	}

	drawCircle(_pos, _rad) {
		let pxCoords = this.curObject.objectCoordToWorldCoord(_pos).copy().multiply(this.scalar);
		const gradient = this.ctx.createConicGradient(-this.curObject.angle, pxCoords.x, pxCoords.y);

		// Add five color stops
		gradient.addColorStop(0, this.ctx.fillStyle);
		gradient.addColorStop(1, this.ctx.fillStyle + 'd0');

		this.ctx.fillStyle = gradient;
		this.ctx.beginPath();
	    this.ctx.ellipse(
	      pxCoords.x, 
	      pxCoords.y, 
	      _rad * this.scalar.x,
	      _rad * this.scalar.y,
	      0,
	      0,
	      2 * Math.PI
	    );
	    this.ctx.closePath();
	}	



	drawVector(_start, _delta, _color = '#f00') {
		let end = _start.copy().add(_delta);
		this.drawVectorTo(_start.copy().multiply(this.scalar), end.multiply(this.scalar), _color);
	}
	drawVectorTo(_start, _end, _color = '#f00') {
		this.ctx.strokeStyle = _color;
		this.ctx.beginPath();
	    this.ctx.moveTo(_start.x, _start.y);
	    this.ctx.lineTo(_end.x, _end.y);
	    this.ctx.closePath();
	    this.ctx.stroke();
	}



	drawPotentialsOfType(_objects, _potType) {
		let scalar = this.scalar.scale(1 / this.#potResulution);
		let kernelOutputSize = new Vector2D(Math.ceil(this.viewSize.x * scalar.x), Math.ceil(this.viewSize.y * scalar.y))

			
		let potPosses = [];
		let sigmas = [];
		let periods = [];
		for (let obj of _objects)
		{
			for (let pot of obj.potentials)
			{
				if (pot.type !== _potType) continue;
				let potPos = obj.objectCoordToWorldCoord(pot.relPos);
				potPosses.push([potPos.x / this.viewSize.x, potPos.y / this.viewSize.y])
				sigmas.push(pot.sigma);
				periods.push(pot.period);
			}
		}
		if (potPosses.length === 0) return;


		console.time('calc');
		let pxArr = new Uint8ClampedArray(this.#potKernel(potPosses, sigmas, periods, potPosses.length, kernelOutputSize.value, this.viewSize.value));
		console.timeEnd('calc');

		console.time('set');
		const imgData = new ImageData(pxArr, kernelOutputSize.x, kernelOutputSize.y);
		this.ctx.putImageData(imgData, 0, 0);
		console.timeEnd('set');




		// let outPixels = calcPixels(_objects.map(o => o.position.value), _objects.length, kernelOutputSize.value, scalar.value);
		// _objects = [_objects[0]];

		// console.time('calc');
		// let scalar = this.scalar.scale(1 / this.#potResulution);
		// let kernelOutputSize = new Vector2D(Math.ceil(this.viewSize.x * scalar.x), Math.ceil(this.viewSize.y * scalar.y))

		// let objPosses = _objects.map(o => [o.position.value[0] / this.viewSize.x, o.position.value[1] / this.viewSize.y]);

		// console.time('calc');
		// let outPixels = this.#potKernel(objPosses, objPosses.length, kernelOutputSize.value, this.viewSize.value);
		// console.timeEnd('calc');

		// console.time('flatten');
		// let pxArr = new Uint8ClampedArray(this.#flattenDataKernel(outPixels, kernelOutputSize.value, this.#potResulution));
		// console.timeEnd('flatten');

		// console.time('set');
		// const imgData = new ImageData(pxArr ,kernelOutputSize.x, kernelOutputSize.y);
		// this.ctx.putImageData(imgData, 0, 0);
		// console.timeEnd('set');

		// console.timeEnd('calc');
		// console.time('write');
		// const boxSizeWidth = Math.round(this.canvas.width / outPixels.length);
		// const boxSizeHeight = Math.round(this.canvas.height / outPixels[0].length);
		// for (let x = 0; x < outPixels.length; x++)
		// {
		// 	for (let y = 0; y < outPixels[x].length; y++)
		// 	{
		// 		this.ctx.fillStyle = 'rgba(' + outPixels[x][y].join(',') + ', 0.5)';
		// 		this.ctx.fillRect(x * boxSizeWidth, y * boxSizeHeight, boxSizeWidth, boxSizeHeight);
		// 		this.ctx.fill();
		// 	}
		// }
		// console.timeEnd('write');


		// let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
	
		// for (let x = 0; x < outPixels.length; x++)
		// {
		// 	for (let y = 0; y < outPixels[x].length; y++)
		// 	{
		// 		let index = 4 * (x + y * imageData.width);
		// 		imageData.data[index + 0] = outPixels[x][y][0];
		// 		imageData.data[index + 1] = outPixels[x][y][1];
		// 		imageData.data[index + 2] = outPixels[x][y][2];
		// 		imageData.data[index + 3] = 255;
		// 	}

		// }

		// this.ctx.putImageData(imageData, 0, 0);



		// let step = 0.5;
		// for (let x = 0; x < this.viewSize.x; x += step)
		// {
		// 	for (let y = 0; y < this.viewSize.y; y += step)
		// 	{
		// 		let curPos = new Vector2D(x, y);
		// 		let potSum = 0;

		// 		for (let obj of _objects)
		// 		{
		// 			// let obj = _objects[0];
		// 			for (let pot of obj.potentials)
		// 			{
		// 				if (pot.type !== _potType) continue;
		// 				let objCoordPos = obj.worldCoordToObjectCoord(curPos);
		// 				let curPot = pot.calcPotential(objCoordPos);
		// 				potSum += curPot;
		// 			}
		// 		}
		// 		let normPot = potSum;

		// 		let pxPos = curPos.copy().multiply(this.scalar);

		// 		let r = Math.min(normPot > 0 ? normPot * 255 : 0, 255);
		// 		let b = Math.min(normPot < 0 ? -normPot * 255 : 0, 255);

		// 		this.ctx.fillStyle = `rgba(${r}, 0, ${b}, 0.5)`;

		// 		this.ctx.beginPath();
		// 		this.ctx.fillRect(pxPos.x - this.scalar.x * step / 2, pxPos.y - this.scalar.y * step / 2, this.scalar.x * step, this.scalar.y * step);
		// 		this.ctx.closePath();
		// 		this.ctx.fill();
		// 	}

		// }
	}

}




export class PotentialRenderer extends BaseRenderer {
	constructor({canvas, viewSize}) {
		super(...arguments);
	}

	draw(_potential) {
		let step = 0.05;
		let objectPos = this.viewSize.copy().scale(0.5);
		for (let x = 0; x < this.viewSize.x; x += step)
		{
			for (let y = 0; y < this.viewSize.y; y += step)
			{

				let pos = new Vector2D(x, y);
				let objCoordPos = objectPos.difference(pos);

				let pot = _potential.calcPotential(objCoordPos);
				let normPot = pot / 2;

				let pxPos = pos.copy().multiply(this.scalar);

				let r = Math.min(normPot > 0 ? normPot * 255 : 0, 255);
				let b = Math.min(normPot < 0 ? -normPot * 255 : 0, 255);

				this.ctx.fillStyle = `rgb(${r}, 0, ${b})`;
				this.ctx.beginPath();
				this.ctx.fillRect(pxPos.x - this.scalar.x * step / 2, pxPos.y - this.scalar.y * step / 2, this.scalar.x * step, this.scalar.y * step);
				this.ctx.closePath();
				this.ctx.fill();
			}

		}
	}
}



