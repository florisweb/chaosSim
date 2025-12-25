
import Plotly from 'plotly.js-dist';
window.Plotly = Plotly

export default class GraphPanel {
	
	constructor() {

	}

	update(_data) {
		let trace = {
			x: _data.map(r => r.time),
		  	y: _data.map(r => r.angle),
		  	mode: 'markers',
		  	type: 'scatter'
		}
		Plotly.newPlot('graphPanel', [trace]);
	}
}