import { Vector3D, Vector2D } from './vector.js';


export default class Recorder {
	
	data = [];
	recordInterval = 0 // s
	constructor({recordInterval} = {}) {
		this.recordInterval = recordInterval;
	}

	#lastRecordTime = 0;
	record(simulation) {
		if (simulation.time - this.#lastRecordTime < this.recordInterval) return;

		this.data.push({
			time: simulation.time,
			angle: simulation.objects[0].angle
		});

		this.#lastRecordTime = simulation.time;
		this.onDataChange(this.data);
	}

	dataToCSV(_header = 'Time (s), angle') {
		let csv = _header + '\n';
		for (let row of this.data)
		{
			csv += Object.values(row).join(',') + '\n';
		}
		return csv;
	}

	downloadDataAsCSV(_header) {
	    const blob = new Blob([this.dataToCSV(_header)], { type: 'text/csv' });
	    const url = URL.createObjectURL(blob);
	    const a = document.createElement('a');
	    a.href = url;
	    a.download = 'data.csv';
	    a.click();
	}

	

	// Hook
	onDataChange(_data) {}
}



