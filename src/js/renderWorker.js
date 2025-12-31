import { Vector3D, Vector2D } from './vector.js';
import { GPU } from 'gpu.js';
const gpu = new GPU();

const config = {
	pxOutputSize: [0, 0],
	viewSize: [0, 0]
};

let isSetUp = false;
let potKernels = {};

onmessage = (e) => {
	let message = e.data;
	const messageType = message.type;
	switch (messageType)
	{
		case 'setup':
			setup(message.data); 

		break;
		case 'calcPotential': 
			if (!isSetUp) return console.warn('RenderWorker: not setup yet.');
			let kernel = potKernels[message.data.potType];
			if (!kernel) return console.warn('RenderWorker: potential kernel of type ' + message.data.potType + ' not found.');
			let output = new Uint8ClampedArray(
				kernel(
					...message.data.parameters,
					config.pxOutputSize,
					config.viewSize,
				)
			);

			postMessage({
				type: 'potentialResult',
				data: output,
			});
		break;
		default: 
			console.log('RenderWorker: Received unknown message from main thread', message);
			break;
	}
};


function setup(_config) {
	isSetUp = true;
	config.pxOutputSize = _config.pxOutputSize;
	config.viewSize = _config.viewSize;



	potKernels['LJLikePot'] = gpu.createKernel(function(_positions, _sigmas, _periods, _posLength, _arrSize, _viewSize) {
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
	}).setOutput([config.pxOutputSize[0] * config.pxOutputSize[1] * 4]);



	potKernels['ChargePot'] = gpu.createKernel(function(_positions, _charges, _posLength, _arrSize, _viewSize) {
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
			let dx = _positions[i][0] - x;
			let dy = _positions[i][1] - y;
			let distance = Math.sqrt(dx**2 + dy**2) * _viewSize[0]; // Convert unitary units to world units
	
			// Todo: true equation
			let potVal = 1 / distance * _charges[i];
			sum += potVal;
		}

		let normPot = sum;
		let r = Math.min(normPot > 0 ? normPot * 255 : 0, 255);
		let b = Math.min(normPot < 0 ? -normPot * 255 : 0, 255);
		
		let color = [r, 0, b, 125]
	    return color[channel];
	}).setOutput([config.pxOutputSize[0] * config.pxOutputSize[1] * 4]);

}

// drawPotentialsOfType(_objects, _potType) {
// 	let scalar = this.scalar.scale(1 / this.#potResulution);
// 	let kernelOutputSize = new Vector2D(Math.ceil(this.viewSize.x * scalar.x), Math.ceil(this.viewSize.y * scalar.y))

		
// 	let potPosses = [];
// 	let sigmas = [];
// 	let periods = [];
// 	for (let obj of _objects)
// 	{
// 		for (let pot of obj.potentials)
// 		{
// 			if (pot.type !== _potType) continue;
// 			let potPos = obj.objectCoordToWorldCoord(pot.relPos);
// 			potPosses.push([potPos.x / this.viewSize.x, potPos.y / this.viewSize.y])
// 			sigmas.push(pot.sigma);
// 			periods.push(pot.period);
// 		}
// 	}
// 	if (potPosses.length === 0) return;


// 	console.time('calc');
// 	let pxArr = new Uint8ClampedArray(this.#potKernel(potPosses, sigmas, periods, potPosses.length, kernelOutputSize.value, this.viewSize.value));
// 	console.timeEnd('calc');

// 	console.time('set');
// 	const imgData = new ImageData(pxArr, kernelOutputSize.x, kernelOutputSize.y);
// 	this.ctx.putImageData(imgData, 0, 0);
// 	console.timeEnd('set');

