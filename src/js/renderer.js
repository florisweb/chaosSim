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

export class BaseObjectRenderer extends BaseRenderer {
	curObject;
	
	constructor({canvas, viewSize}) {
		super(...arguments);
	}

	

	async draw(_simulation, _renderConfig) {
		// Write to pre-draw canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
}


export default class Renderer extends BaseObjectRenderer {
	#potResulution = 1; // 2x2 'pixels' - must be integer
	renderWorker;
	workerConfig = {};

	#workerRequest;
	constructor({canvas, viewSize}) {
		super(...arguments);

		this.#createPreDrawContext();

		this.renderWorker = new Worker(new URL("./renderWorker.js", import.meta.url));
		this.renderWorker.onmessage = (e) => this.#handleWorkerMessage(e.data);

		let scalar = this.scalar.scale(1 / this.#potResulution);
		let kernelOutputSize = new Vector2D(Math.ceil(this.viewSize.x * scalar.x), Math.ceil(this.viewSize.y * scalar.y))

		this.workerConfig = {
			pxOutputSize: kernelOutputSize.value,
			viewSize: viewSize.value
		}
		this.renderWorker.postMessage({
			type: 'setup',
			data: this.workerConfig
		});
	}

	#createPreDrawContext() {
		this.trueCtx = this.ctx;
		this.preDrawCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);

		this.ctx = this.preDrawCanvas.getContext('2d');
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
	}
	
	#handleWorkerMessage(_message) {
		switch (_message.type) 
		{
			case "potentialResult":
				const imgData = new ImageData(_message.data, this.workerConfig.pxOutputSize[0], this.workerConfig.pxOutputSize[1]);
				this.#workerRequest.resolve(imgData);	
			break;
		}
	}


	async draw(_simulation, _renderConfig) {
		// Write to pre-draw canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		for (let object of _simulation.objects)
		{
			this.drawObject(object);
		}

		this.#renderVoronoiDiagram(_simulation.objects);


		let potPxData;
		if (_renderConfig.renderPotType) potPxData = await this.requestPotentialOfTypeData(_simulation.objects, _renderConfig.renderPotType);

		// Write the pre-drawn data and the worker-rendered data to the true canvas
		this.trueCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if (potPxData) this.trueCtx.putImageData(potPxData, 0, 0);
		this.trueCtx.drawImage(this.preDrawCanvas, 0, 0, this.preDrawCanvas.width, this.preDrawCanvas.height);
	}



	// DEBUG -> directly draws to true canvas
	drawVector(_start, _delta, _color = '#f00') {
		let end = _start.copy().add(_delta);
		this.drawVectorTo(_start.copy().multiply(this.scalar), end.multiply(this.scalar), _color);
	}
	drawVectorTo(_start, _end, _color = '#f00') {
		this.trueCtx.strokeStyle = _color;
		this.trueCtx.beginPath();
	    this.trueCtx.moveTo(_start.x, _start.y);
	    this.trueCtx.lineTo(_end.x, _end.y);
	    this.trueCtx.closePath();
	    this.trueCtx.stroke();
	}


	async requestPotentialOfTypeData(_objects, _potType) {

		let parameters = [];
		let potPosses = [];
		let potAngles = [];
		for (let obj of _objects)
		{
			for (let pot of obj.potentials)
			{
				if (pot.type !== _potType) continue;
				let potPos = obj.objectCoordToWorldCoord(pot.relPos);
				potPosses.push([potPos.x / this.viewSize.x, potPos.y / this.viewSize.y])
				potAngles.push(obj.angle);
			}
		}

		switch (_potType)
		{
			case "LJLikePot":
				let sigmas = [];
				let periods = [];
				for (let obj of _objects)
				{
					for (let pot of obj.potentials)
					{
						if (pot.type !== _potType) continue;
						sigmas.push(pot.sigma);
						periods.push(pot.period);
					}
				}
				parameters = [potPosses, potAngles, sigmas, periods, potPosses.length]
				break;
			case "ChargePot":
				let charges = [];
				for (let obj of _objects)
				{
					for (let pot of obj.potentials)
					{
						if (pot.type !== _potType) continue;
						charges.push(pot.charge);;
					}
				}
				parameters = [potPosses, charges, potPosses.length]
				break;
			default: 
				// Not-supported potential type: fallback
				return this.drawPotentialsOfType_fallback(_objects, _potType); 
		}

		if (potPosses.length === 0) return;

		this.#workerRequest = Promise.withResolvers();


		this.renderWorker.postMessage({
			type: 'calcPotential',
			data: {
				potType: _potType,
				parameters: parameters,
			}
		});

		return this.#workerRequest.promise;
	}

	async drawPotentialsOfType_fallback(_objects, _potType) { // CPU rendered fallback
		let step = 0.5;
		for (let x = 0; x < this.viewSize.x; x += step)
		{
			for (let y = 0; y < this.viewSize.y; y += step)
			{
				let curPos = new Vector2D(x, y);
				let potSum = 0;

				for (let obj of _objects)
				{
					for (let pot of obj.potentials)
					{
						if (pot.type !== _potType) continue;
						let objCoordPos = obj.worldCoordToObjectCoord(curPos);
						let curPot = pot.calcPotential(objCoordPos);
						potSum += curPot;
					}
				}
				let normPot = potSum;

				let pxPos = curPos.copy().multiply(this.scalar);

				let r = Math.min(normPot > 0 ? normPot * 255 : 0, 255);
				let b = Math.min(normPot < 0 ? -normPot * 255 : 0, 255);

				this.ctx.fillStyle = `rgba(${r}, 0, ${b}, 0.5)`;

				this.ctx.beginPath();
				this.ctx.fillRect(pxPos.x - this.scalar.x * step / 2, pxPos.y - this.scalar.y * step / 2, this.scalar.x * step, this.scalar.y * step);
				this.ctx.closePath();
				this.ctx.fill();
			}
		}
	}



	#renderVoronoiDiagram(_objects) {
		
		let lines = [];
		for (let i = 0; i < _objects.length; i++)
		{
			for (let j = i + 1; j < _objects.length; j++)
			{
				lines.push(new VoronoiLine(_objects[i], _objects[j]));
			}
		}
		// lines = lines.splice(0, 2);

		for (let i = 0; i < lines.length; i++)
		{
			for (let j = i + 1; j < lines.length; j++)
			{
				let lineA = lines[i];
				let lineB = lines[j];
				if (!lineA.hasSharedObject(lineB)) continue; // Only lines with a shared point may intersect?
				let nonSharedPointForLineA = lineA.getNonSharedObject(lineB).position.copy();
				let nonSharedPointForLineB = lineB.getNonSharedObject(lineA).position.copy();
				// console.warn('compare lines', lineA.id, lineB.id, 'nonSharedA:', lineA.getNonSharedObject(lineB).id, 'nonSharedB:', lineB.getNonSharedObject(lineA).id);

				let delta12 = lineA.difference;
				let delta34 = lineB.difference;

				let intersectionValA = 
					0.5 * (
						delta34.x * (lineB.posA.x + lineB.posB.x - lineA.posA.x - lineA.posB.x) +
						delta34.y * (lineB.posA.y + lineB.posB.y - lineA.posA.y - lineA.posB.y) 
					) / (delta12.x * delta34.y - delta12.y * delta34.x);

				let intersectionValB = 
					0.5 * (
						delta12.x * (lineB.posA.x + lineB.posB.x - lineA.posA.x - lineA.posB.x) +
						delta12.y * (lineB.posA.y + lineB.posB.y - lineA.posA.y - lineA.posB.y) 
					) / (delta12.x * delta34.y - delta12.y * delta34.x);


				let relPosNonSharedPointA = nonSharedPointForLineA.subtract(lineA.centrePos);
				let relPosNonSharedPointB = nonSharedPointForLineB.subtract(lineB.centrePos);

				
				let projectionA = relPosNonSharedPointA.dotProduct(lineA.direction);
				if (projectionA < 0) 
				{
					lineA.minVal = Math.max(lineA.minVal, intersectionValA);
					// console.log(lineA.id, 'shortened (min) by', lineA.getNonSharedObject(lineB).id)
				} else {
					lineA.maxVal = Math.min(lineA.maxVal, intersectionValA);
					// console.log(lineA.id, 'shortened (max) by', lineA.getNonSharedObject(lineB).id)
				}

				let projectionB = relPosNonSharedPointB.dotProduct(lineB.direction);
				if (projectionB < 0) 
				{
					lineB.minVal = Math.max(lineB.minVal, intersectionValB);
					// console.log(lineB.id, 'shortened (min) by', lineB.getNonSharedObject(lineA).id);
				} else {
					lineB.maxVal = Math.min(lineB.maxVal, intersectionValB);
					// console.log(lineB.id, 'shortened (max) by', lineB.getNonSharedObject(lineA).id);
				}


				// TODO: check whether the line is valid: A | B | C problem -> must have shared object?
			}
		}


		for (let line of lines) line.draw(this);
	}
}

class VoronoiLine {
	objA;
	objB;
	get id() {
		return this.objA.id + ' - ' + this.objB.id;
	}
	minVal = -10;
	maxVal = 10;
	junctionValues = new Set();

	hasSharedObject(_otherLine) {
		return this.objA === _otherLine.objA || this.objA === _otherLine.objB || this.objB === _otherLine.objA || this.objB === _otherLine.objB;
	}
	getNonSharedObject(_otherLine) { // Assuming a shared point
		if (this.objA === _otherLine.objA || this.objB === _otherLine.objA) return _otherLine.objB;
		return _otherLine.objA;
	}

	get posA() {
		return this.objA.position;
	}
	get posB() {
		return this.objB.position;
	}
	get centrePos() { 
		return this.posA.copy().scale(0.5).add(this.posB.copy().scale(0.5));
	}


	get difference() {
		return this.posA.difference(this.posB);
	}
	get direction() {
		return this.difference.perpendicular;
	}

	constructor(_objA, _objB) {
		this.objA = _objA;
		this.objB = _objB;
	}

	getPosByVal(_lambda) {
		return this.centrePos.add(this.direction.copy().scale(_lambda));
	}

	draw(_drawer) {
		let startPos = this.getPosByVal(this.minVal).multiply(_drawer.scalar);
		let endPos = this.getPosByVal(this.maxVal).multiply(_drawer.scalar);
		_drawer.ctx.strokeStyle = '#f00';
		_drawer.ctx.beginPath();
		_drawer.ctx.moveTo(startPos.x, startPos.y);
		_drawer.ctx.lineTo(endPos.x, endPos.y);
		_drawer.ctx.closePath();
		_drawer.ctx.stroke();


		for (let j of this.junctionValues)
		{
			let pos = this.getPosByVal(j).multiply(_drawer.scalar);
			_drawer.ctx.strokeStyle = '#0f0';
			_drawer.ctx.beginPath();
			_drawer.ctx.moveTo(pos.x, pos.y);
			_drawer.ctx.lineTo(pos.x, pos.y - 30);
			_drawer.ctx.closePath();
			_drawer.ctx.stroke();
		}
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



