
import Plotly from 'plotly.js-dist';
window.Plotly = Plotly

export default class GraphPanel {


	update(_data) {
		if (_data.length === 0) return;
		let props = Object.keys(_data[0]).filter(k => k != 'time');
		let data = [];
		for (let prop of props)
			data.push({
				x: _data.map(r => r.time),
			  	y: _data.map(r => r[prop]),
			  	mode: 'markers',
			  	type: 'scatter'
			});
		Plotly.newPlot('graphPanel', data);
	}
}