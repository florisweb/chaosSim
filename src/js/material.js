
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

export class BucketMaterial extends Material {
	color = '#0f0';
	density = 1;
} 
export class WaterMaterial extends Material {
	color = '#00f';
	density = 2;
} 