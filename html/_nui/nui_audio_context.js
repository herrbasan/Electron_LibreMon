'use strict';
import ut from './nui_ut.js';

let global_audio = {};

global_audio.context = new (window.AudioContext || window.webkitAudioContext)({latencyHint: "playback"});
global_audio.gain = global_audio.context.createGain();
global_audio.analyzer = global_audio.context.createAnalyser();
global_audio.canPlay = false; 

init();
function init(){
    global_audio.gain.connect(global_audio.analyzer).connect(global_audio.context.destination);
	unlockAudioContext(global_audio.context);
    if(window) { window.nui_audio = global_audio};
}

function unlockAudioContext(audioCtx) {
	if (audioCtx.state !== 'suspended')  { console.log('Gobal Audio Context Ready'); return; }
	console.log('Audio Context Waiting to be resumed')
	const b = document.body;
	const events = ['touchstart','touchend', 'mousedown','keydown'];
	events.forEach(e => b.addEventListener(e, unlock, false));
	function unlock() { console.log('Gobal Audio Context Ready'), audioCtx.resume().then(clean); canPlay(); }
	function clean() { events.forEach(e => b.removeEventListener(e, unlock)); }
}

function canPlay(){
	global_audio.canPlay = true;
}

global_audio.playFile = async function(url, autoplay){
	let audio = ut.createElement('audio');
	audio.ctx = global_audio.context;
	audio.audioCtx_source = audio.ctx.createMediaElementSource(audio);
	audio.gainNode = audio.ctx.createGain();
	audio.gainNode.gain.value = 1;
	audio.volume = 1;
	audio.audioCtx_source.connect(audio.gainNode);
	audio.gainNode.connect(global_audio.gain);

	audio.src = url;

	global_audio.background = audio;
	return audio;
}

export default global_audio;