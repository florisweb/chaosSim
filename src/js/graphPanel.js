
import Plotly from 'plotly.js-dist';
window.Plotly = Plotly

export default class GraphPanel {
	#data = [];

	clear() {
		this.#data = [];
		Plotly.purge('graphPanel');
	}
	update(_data) {
		if (_data.length === 0) return;
		let props = Object.keys(_data[0]).filter(k => k != 'time');

		if (this.#data.length === 0) 
		{
			for (let prop of props)
			{
				this.#data.push({
					x: _data.map(r => r.time),
				  	y: _data.map(r => r[prop]),
				  	mode: 'markers',
				  	type: 'scatter',
				  	name: prop
				});
			}

			var layout = {
			    showlegend: true
			};
			Plotly.newPlot('graphPanel', this.#data, layout, {displayModeBar: false, displaylogo: false});
		} else {
			for (let p = 0; p < props.length; p++)
			{
				let prop = props[p];
				for (let i = this.#data.length; i < _data.length; i++)
				{
					this.#data[p].x.push(_data[i].time)
					this.#data[p].y.push(_data[i][prop])
				}
			}
			Plotly.redraw('graphPanel');
		}
	}
}