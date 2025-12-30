import Panel from './panel.js';
import Plotly from 'plotly.js-dist';


export default class GraphPanel extends Panel {
	#data = [];

	clear() {
		this.#data = [];
		Plotly.purge(this.HTML.panel.id);
	}

	onProblemChange(_problem) {
		this.setHideState(_problem.recordables.length == 0);
	}

	onResize() {
		this.#buildGraphFromScratch(this.#data);
	}

	update(_data) {
		if (this.#data.length === 0) return this.#buildGraphFromScratch(_data);

		let props = Object.keys(_data[0]).filter(k => k != 'time');
		for (let p = 0; p < props.length; p++)
		{
			let prop = props[p];
			for (let i = this.#data.length; i < _data.length; i++)
			{
				this.#data[p].x.push(_data[i].time)
				this.#data[p].y.push(_data[i][prop])
			}
		}
		Plotly.redraw(this.HTML.panel.id);
	}

	#buildGraphFromScratch(_data) {
		if (_data.length === 0) return;
		let props = Object.keys(_data[0]).filter(k => k != 'time');
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
		    showlegend: true,
		    legend: {
		    	orientation: 'h',
		    	xanchor: "center",
		    	x: 0.5, 
		    	y: 1
		    },
		    margin: {
		    	b: 40,
		    	l: 60,
		    	r: 10,
		    	t: 50,
		    }
		};
		Plotly.newPlot(this.HTML.panel.id, this.#data, layout, {displayModeBar: false, displaylogo: false});
	}
}