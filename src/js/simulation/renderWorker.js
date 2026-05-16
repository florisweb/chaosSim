import { Vector3D, Vector2D } from '../vector.js';
import { GPU } from 'gpu.js';
const gpu = new GPU();

const config = {
	pxOutputSize: [0, 0],
	viewSize: [0, 0]
};

let isSetUp = false;
let potKernels = {};

let fractalKernel;

onmessage = (e) => {
	let message = e.data;
	const messageType = message.type;
	let output;
	switch (messageType)
	{
		case 'setup':
			setup(message.data);
		break;
		case 'calcPotential': 
			if (!isSetUp) return console.warn('RenderWorker: not setup yet.');
			let kernel = potKernels[message.data.potType];
			if (!kernel) return console.warn('RenderWorker: potential kernel of type ' + message.data.potType + ' not found.');
			output = new Uint8ClampedArray(
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
		case 'calcFractal': 
			if (!isSetUp) return console.warn('RenderWorker: not setup yet.');
			output = new Uint8ClampedArray(
				fractalKernel(
					...message.data.parameters,
					config.pxOutputSize,
					config.viewSize,
				)
			);
			postMessage({
				type: 'fractalResult',
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


	potKernels['LJLikePot'] = gpu.createKernel(function(_positions, _angles, _sigmas, _periods, _posLength, _arrSize, _viewSize) {
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
			let dx = x - _positions[i][0];
			let dy = y - _positions[i][1];
			let distance = Math.sqrt(dx**2 + dy**2);
			let angle = Math.atan(dy, dx) + _angles[i]; // Apparently atan = atan(y, x)

			let potVal = 4 * epsilon * (
				(sigma / distance)**12 - (sigma / distance)**6 * Math.cos(angle * _periods[i])
			);

			sum += potVal;
		}

		let normPot = sum;
		let r = Math.min(normPot > 0 ? normPot * 255 : 0, 255);
		let b = Math.min(normPot < 0 ? -normPot * 255 : 0, 255);
		
		let color = [r, 0, b, 125];
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



	
	
	fractalKernel = gpu.createKernel(function(_zoom, _offsetX, _offsetY, _arrSize, _viewSize) {
		// All position units in perc (0-1)
		const channels = 4;
		const steps = 100;
		let index = this.thread.x;
		let arrX = (index % (_arrSize[0] * channels)) / channels;
		let arrY = Math.floor((index / channels - arrX) / _arrSize[1]);

		let channel = index % channels;
		let x = arrX / _arrSize[0];
		let y = arrY / _arrSize[1];


		// let c = [(x - percOffset[0]) * _viewSize[0] * _zoom, (y - percOffset[1]) * _viewSize[1] * _zoom]; // [real, imag]
		let c = [(x - 0.5) * _zoom + _offsetX, (y - 0.5) * _zoom + _offsetY]; // [real, imag]
		let z = c;

		let color = [0, 0, 0, 255];
		for (let i = 0; i < 100; i++)
		{
			let real = z[0] * z[0] - z[1] * z[1] + c[0];
			z[1] = z[0] * z[1] + z[1] * z[0] + c[1];
			z[0] = real;

			if (Math.abs(z[0]) <= 2 && Math.abs(z[1]) <= 2) continue;
			let angle = Math.atan((c[1] - z[1])/(c[0] - z[0]));
			// color = [Math.round(255 - angle / 2 * 255), Math.round(i/steps*255), Math.round(angle / 2 * 255), 255];
			color = [Math.round(255 - i / steps * 255), 0, Math.round(i / steps * 255), 255];
			break;
		}
		
	    return color[channel];
	}).setOutput([config.pxOutputSize[0] * config.pxOutputSize[1] * 4]);



	
	
	

}
