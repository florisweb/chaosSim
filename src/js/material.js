
class Material {
	name = 'Base';
	density = 1;
	color = '#f00';

	constructor() {

	}
	getFillStyle() {
		return this.color;
	}
}


export class ArmMaterial extends Material {
	density = 5;
} 
