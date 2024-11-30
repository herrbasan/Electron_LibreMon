'use strict';
import ut from './nui_ut.js';

function audioVisualizer(analyser, target, settings){
	if(!settings) { settings = {};}
	analyser.fftSize = settings.fftSize || (1024*2);
	settings.type = settings.type || 'spec';
	settings.width = settings.width || 400;
	settings.height = settings.height || 100;
	analyser.smoothingTimeConstant = settings?.smoothingTimeConstant || 0.4;
	analyser.observer = new IntersectionObserver((e) => { analyser.isVisible = e[0].isIntersecting; loop(); }, {threshold:0});
	let dataArray = new Uint8Array(analyser.frequencyBinCount);
	let floatArray = new Float32Array(analyser.frequencyBinCount);
	analyser.getByteTimeDomainData(dataArray);
	
	let canvas = ut.createElement('canvas', {attributes:{width:settings.width, height:settings.height}, target:target})
	let ctx = canvas.getContext('2d');
	
	let lastFloatData = 0;
	let lastTimeData = 0;
	let render = drawSpectrum;
	let sampleRate = analyser.context.sampleRate;
	if(settings.type == 'osc'){
		render = drawOsc;
	}


	loop();
	analyser.observer.observe(target);
	function loop(){
		if(!analyser.isVisible) { return; }
		render(settings.bands);
		requestAnimationFrame(loop)
	}


	function drawSpectrum(num_bands){
		if(!analyser) { return;}
		analyser.getFloatFrequencyData(floatArray);
		let check = floatArray.reduce((pv, cv) => pv + cv, 0);
		if( check != lastFloatData){
			lastFloatData = check;
			let bands = [];
			if(num_bands){
				let range = ((sampleRate-(sampleRate*0.2))/2) / num_bands;
				let start = 0;
				let end = range;
				for(let i=0; i<num_bands; i++){
					bands.push(getFrequencyRange(analyser, floatArray, start, end));
					start += range;
					end = start+range;
				}
			}
			else {
				bands.push(getFrequencyRange(analyser, floatArray, 0, 100));
				bands.push(getFrequencyRange(analyser, floatArray, 100, 200));
				bands.push(getFrequencyRange(analyser, floatArray, 200, 300));
				bands.push(getFrequencyRange(analyser, floatArray, 300, 500));
				bands.push(getFrequencyRange(analyser, floatArray, 500, 800));
				bands.push(getFrequencyRange(analyser, floatArray, 800, 1500));
				bands.push(getFrequencyRange(analyser, floatArray, 1500, 3000));
				bands.push(getFrequencyRange(analyser, floatArray, 3000, 6000));
				bands.push(getFrequencyRange(analyser, floatArray, 6000, 20000));
			}
			
			drawBars(bands);

		}

	}
	

	function drawBars(bands){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		let gap = 4;
		let barWidth = ((canvas.width+gap)/bands.length) - gap;
		let x = 0;
		for(let i=0; i<bands.length; i++){
			let barHeight = canvas.height * bands[i];
			ctx.fillStyle = settings.fill_back || 'rgba(80,80,80,0.1)';
			ctx.fillRect(x, 0, barWidth, canvas.height);
			ctx.fillStyle = settings.fill_fore || 'rgba(150,150,150,0.7)';
			ctx.fillRect(x,canvas.height-barHeight,barWidth,barHeight);
			x += barWidth + gap;
		}
	}
	
	
	
	function drawTrueVol(){
		analyser.getFloatTimeDomainData(floatArray);

		
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let sum = 0;
		let peakInstantaneousPower = 0;
		for(let i = 0; i < analyser.frequencyBinCount; i++) {
			let power = floatArray[i] ** 2;
			sum += power;
			peakInstantaneousPower = Math.max(power, peakInstantaneousPower);
		}
		let avgPowerDecibels = 10 * Math.log10(sum / analyser.frequencyBinCount);
		let peakInstantaneousPowerDecibels = 10 * Math.log10(peakInstantaneousPower);
		if(avgPowerDecibels < -40){
			avgPowerDecibels = -40;
		}
		if(peakInstantaneousPowerDecibels < -40){
			peakInstantaneousPowerDecibels = -40;
		}
		let proz = (peakInstantaneousPowerDecibels+40)/40;
		ctx.fillStyle = 'rgba(100,100,100,1)';
		ctx.fillRect(0,0,canvas.width*proz,20);
		/*ctx.fillStyle = 'rgba(255,255,255,0.5)';
		ctx.fillRect(canvas.width*barWidth-2,0,3,canvas.height);*/
	}

	
	function drawOsc() {
		if(!analyser){ return; }
		analyser.getByteTimeDomainData(dataArray);
		let check = dataArray.reduce((pv, cv) => pv + cv, 0);
		if( check != lastTimeData){
			lastTimeData = check;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = settings.fill_back || 'rgba(80,80,80,0.1)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.beginPath();

			var sliceWidth = canvas.width / analyser.frequencyBinCount;
			var x = 0;

			for (var i = 0; i < analyser.frequencyBinCount; i++) {

				var v = dataArray[i] / 128;
				var y = v * (canvas.height / 2);
				if (i === 0) {
				ctx.moveTo(x, y);
				} else {
				ctx.lineTo(x, y);
				}

				x += sliceWidth;
			}

			ctx.lineWidth = settings.line_width || 1;
			ctx.strokeStyle = settings.fill_fore || 'rgba(150, 150, 150,1)';
			ctx.lineTo(canvas.width, canvas.height/2);
			ctx.stroke();
		}
		
	}
}

function getFrequencyRange(analyser, dataArray, min, max) {
	let rate = analyser.context.sampleRate;
	let length = analyser.frequencyBinCount;
	let start = frequencyToIndex(min, rate, length);
	let end = frequencyToIndex(max, rate, length);
	let count = end - start;
	let sum = 0;

	for(; start < end; start++){
		sum += dataArray[start];
	}

	let value = count === 0 || !isFinite(sum) ? analyser.minDecibels : sum / count;
	let proz = (value - analyser.minDecibels) / (analyser.maxDecibels - analyser.minDecibels);
	if( proz < 0) { proz = 0; }
	if( proz > 1) { proz = 1; }
	return proz;
}



function frequencyToIndex(hz, rate, length){
		let n = rate /2;
		let idx = Math.round((hz / n) * length);
		return Math.min(length, Math.max(0, idx));
	}

function indexToFrequency(idx, rate, length){
	return (idx * rate) / ( length * 2);
}


export default audioVisualizer;