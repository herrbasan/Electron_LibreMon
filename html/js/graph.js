'use strict';

import ut from "../nui/nui_ut.js";
import nui from "../nui/nui.js";

let graph = {};

function init(target, _options){
	let options = _options ? _options : {};
	options.target = target;
	options.pixRatio = options.pixRatio || window.devicePixelRatio;
	options.wrap = ut.createElement('div', {classes:'graph_wrap', style:{position:'absolute', overflow:'hidden', width:'100%', height:'100%'}, target:target})
	options.canvas = ut.createElement('canvas', {target:options.wrap});
	options.ctx = options.canvas.getContext('2d');
	options.frame = options.frame ? options.frame * 2 * options.pixRatio : 0;
	options.reverse = options.reverse || false;
	options.lineWidth = options.lineWidth ? options.lineWidth * options.pixRatio : options.pixRatio*2;
	options.strokeStyle = options.strokeStyle || 'rgba(180,180,180,1)';
	options.lineJoin = options.lineJoin || 'miter';
	options.lineCap = options.lineCap || 'round';
	options.fillStyle = options.fillStyle;
	target.style.position = 'relative';

	options.draw = (data) => drawGraph(options, data);
	return options;
}

function drawGraph(options, data){
	let ctx = options.ctx;
	let canvas = options.canvas;
	canvas.width = options.wrap.offsetWidth*(options.pixRatio ? options.pixRatio*2 : 2);
	canvas.height = options.wrap.offsetHeight*(options.pixRatio ? options.pixRatio*2 : 2);
	let scale = options.wrap.offsetWidth / canvas.width;
	canvas.style.transformOrigin = '0 0';
	canvas.style.transform = `scale(${scale}, ${scale})`;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineWidth = options.lineWidth;
	ctx.strokeStyle = options.strokeStyle;
	ctx.lineJoin = options.lineJoin;
	ctx.lineCap = options.lineCap;
	ctx.fillStyle = options.fillStyle;
	let cheight = canvas.height - (options.frame*2);
	let cwidth = canvas.width - (options.frame*2);
	let cstart = options.frame;
	let hPix = cwidth / data.length;

	ctx.beginPath();
	ctx.moveTo(cstart,cheight);
	let maxVal = options.maxVal || 0;
	if(maxVal == 0) { maxVal = getMaxValue(data, options.minVal || 0); }
	for(let i=0; i < data.length; i++){
		let val = data[i] ? data[i] : 0;
		val = Math.ceil((val / maxVal)*cheight);
		if(!options.reverse){
			val = cheight - val;
		}
		if(i == 0){
			ctx.moveTo(cstart + hPix*i, cstart+val)
		}
		if(i == data.length-1){
			ctx.lineTo(cstart + cwidth, cstart+val);
		}
		else {
			ctx.lineTo(cstart + hPix*i, cstart+val);
		}
	}
	
	ctx.stroke();
	
	
	if(options.fillStyle){
		ctx.lineTo(cstart+cwidth, cstart+cheight);
		ctx.lineTo(cstart,cstart+cheight);
		ctx.lineTo(cstart,cstart);
		ctx.fill();
		ctx.restore();
	}
}

function getMaxValue(ar, minVal){
	let maxVal = minVal;
	for(let i=0; i<ar.length; i++){
		let val = ar[i] ? ar[i] : 0;
		if(val > maxVal){
			maxVal = val;
		}
	}
	return maxVal;
}

graph.init = init;
export { graph };