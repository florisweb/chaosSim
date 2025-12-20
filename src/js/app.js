import { Vector2D, Vector3D } from './vector.js';
import Simulation from './simulation.js';
import Renderer from './renderer.js';



const App = new class {
	simulation;
	renderer;

	constructor() {
		window.App = this;
		let size = new Vector2D(50, 50);

		this.renderer = new Renderer({canvas: document.querySelector('#worldCanvas')});
		this.simulation = new Simulation({size: size});
		
		this.setup().then(() => document.body.classList.remove('loading'));
	}

	async setup() {
		this.draw();
		this.update();
	}

	draw() {
		this.renderer.draw(this.simulation);
		requestAnimationFrame(() => this.draw());
	}

	update() {
		// for (let i = 0; i < 20; i++) 
		this.simulation.update();
		setTimeout(() => this.update(), 1);
	}
}







export default App;