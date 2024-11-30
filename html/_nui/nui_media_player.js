'use strict';
import ut from './nui_ut.js';
import dragSlider from './nui_drag_slider.js';

let css_vars;

/* Media Player
##########################################################################################
########################################################################################## */

function mediaPlayer(options){
	options.html = renderHTML();
	checkCSS('./nui/css/nui_media.css', '--nui-media').then(() => {
		if(options.media){
			initMediaPlayer(options);
		}
		else {
			createMediaPlayer(options)
		}
	})
	return options.html;
}

function createMediaPlayer(settings){
	let media = ut.createElement(settings.type || 'video', {attributes:{poster:settings.poster || ''}});
	let source = ut.createElement('source', {attributes:{src:settings.url}, target:media});
    settings.media = media;
	return initMediaPlayer(settings);;
}


function initMediaPlayer(settings) {
	let verbose = settings?.verbose || false;
	let pause_other_players = settings?.pause_other_players || false;
	let media = ut.el(settings.media);
	let media_type = media.tagName.toLowerCase();
	let duration = 0;
	let html = settings.html;
	
	html.settings = settings;
	html.addClass(media_type);
	if(settings?.classes) { html.addClass(settings?.classes)}

	if(settings.hide_fs_button) { html.el('.fullscreen').style.display = 'none'; }

	fb('Media Type: ' + media_type);
	fb('Insert Controls');

	
	html.player_id = ut.id();
	html.wrap = html.el('.wrap');
	html.bottom = html.el('.bottom');
	html.controls = html.el('.controls');
	html.volume = html.el('.volume');
	html.volume_proz = html.el('.volume .proz');
	html.volume_icon = html.controls.el('.volume_icon');
	html.playpause = html.el('.playpause');
	html.timeline = html.el('.timeline');
	html.timeline_bar = html.el('.timeline .bar');
	html.timeline_proz = html.el('.timeline .proz');
	html.time = html.el('.time');
	html.duration = html.el('.duration');
	html.widget = html.el('.widget');
	html.info = html.el('.info');
	html.fullscreen = html.el('.fullscreen');
	html.cleanUp = cleanUp;

	if(media_type == 'audio'){
		ut.killMe(html.el('.bottom_shade'));
		ut.killMe(html.el('.fullscreen'))
	}
	if(media.parentNode){ media.parentNode.insertBefore(html, media); }
	html.media = html.appendChild(media);
	media.setAttribute('playsinline','true');
	if(settings.streaming) { media.setAttribute('crossOrigin','anonymous'); }
	media.controls = null;
	if(!window.nui_media_active_players){ window.nui_media_active_players = {}; }
	window.nui_media_active_players[html.player_id] = html;



	/* Detect iOS */
	media.volume = 0.9;
	setTimeout(() => {
		if(media.volume != 0.9) {
			html.isIOS = true;
			//html.volume_icon.style.display = 'none';
			media.src = media.currentSrc + '#t=0.001'; 
		};
		media.volume = 1; 
	},1);

	html.player_observer = new IntersectionObserver((e) => { html.isVisible = e[0].isIntersecting; update(); }, {threshold:0});
	if(media.readyState < 3){ html.media.addEventListener('loadedmetadata', mediaLoaded); }
	else { start(); }

	function mediaLoaded(e){
		if(e.type == 'loadedmetadata'){
			html.media.removeEventListener('loadedmetadata', mediaLoaded)
			html.isStream = !isFinite(html.media.duration);
			start();
		}
	}

	function start(){
		fb('Init ' + media.currentSrc);
		html.registeredEvents = [];
		//_event(media, 'seeking', mediaInfo);
		_event(media, 'error', mediaInfo);
		_event(media, 'ended', mediaInfo);
		_event(media, 'waiting', mediaInfo);
		_event(media, 'canplay', mediaInfo);
		_event(media, 'canplaythrough', mediaInfo);
		_event(media, 'playing', mediaInfo);
		_event(media, 'pause', mediaInfo);
		_event(media, 'durationchange', mediaInfo);
		_event(html.playpause, 'click', togglePlay)
		_event(html.fullscreen, 'click', toggleFullscreen)

		if(media_type == 'video'){
			_event(window, 'mousemove', windowEvents);
			_event(html, 'click', stageEvents);
			_event(html, 'touchend', stageEvents);
			_event(html, 'touchmove', stageEvents);
			_event(html, 'mousemove', stageEvents);
			_event(html, 'mouseover', stageEvents);
			_event(html, 'mouseleave', stageEvents);
		}
		
		_event(html.volume_icon, 'mouseover', volumeEvents);
		_event(html.volume_icon, 'click', volumeEvents);
		_event(html.volume_icon, 'touchend', volumeEvents);
		_event(html.duration, 'mouseover', volumeLeave);
		_event(html.bottom, 'mouseleave', volumeLeave);

		if(!html.isStream || true){
			_event(html.timeline, 'mouseover', widgetEvents);
			_event(html.timeline, 'mouseout', widgetEvents);
			_event(html.timeline, 'mousemove', widgetEvents);
			html.ts_drag_slider = dragSlider(html.timeline, timelineSlider);
		}
		if(window?.nui_audio && !html.settings.ctx){
			console.log('Global Audio Context Found')
			createAudioNode(window.nui_audio.context, window.nui_audio.gain);
		}
		


		updateDuration();
		update();
		
		setTime(html.media.currentTime, html.time);
		html.player_observer.observe(html);
		
		html.vs_drag_slider = dragSlider(html.volume, volumeSlider);
		html.info.style.opacity = 0;
		html.current_volume = 1;
		html.addClass('init');
		html.style.opacity = null;
		if(settings.muted) { html.media.muted = true; }
		if(settings.loop) { html.media.loop = true; }
		if(settings.autoplay) { html.media.play(); }
		if(settings.hideControls && !settings.outside_control) { hideControls(0); }
		if(settings.outside_control){
			html.addClass('outside')
			/*let control_height = css_vars['--media-control-height'].value + css_vars['--media-control-height'].unit;
			html.style.marginBottom = control_height;
			html.el('.controls').style.overflow = 'unset';
			html.el('.bottom_shade').style.display = 'none';
			html.el('.fullscreen').style.display = 'none';
			html.style.overflow = 'unset';
			html.el('.bottom').style.transform = `translateY(${control_height})`;
			html.el('.widget').style.transform = `translate(-2rem,${control_height})`;
			console.log(css_vars['--media-control-height']);*/
		}
	}

	function _event(target, event, fnc, options){
		html.registeredEvents.push({target:target, event:event, fnc:fnc});
		target.addEventListener(event, fnc, options);
	}

	function cleanUp(){
		html.isVisible = false;
		for(let i=0; i<html.registeredEvents.length; i++) {
			html.registeredEvents[i].target.removeEventListener(html.registeredEvents[i].event, html.registeredEvents[i].fnc);
			fb('Removed Event: ' + html.registeredEvents[i].event);
		}
		html.ts_drag_slider.cleanUp();
		html.vs_drag_slider.cleanUp();
		html.player_observer.disconnect();
		clearTimeout(html.widget_timeout);
		clearTimeout(html.volume_timeout);
		clearTimeout(html.stageclick_timeout);
		clearTimeout(html.control_timeout);
		html.parentNode.insertBefore(media, html);
		media.controls = true;
		media.pause();
		ut.killMe(html);
		delete window.nui_media_active_players[html.player_id];
		html = null;
		//console.log(window.nui_media_active_players)
	}

	function updateDuration(n){
		if(!n) { n = isFinite(media.duration) ? media.duration : 0 }
		duration = n;
		html.duration.innerText = ut.playTime(duration*1000).minsec;
	}
	function mediaInfo(e){
		reportEvents(e);
		if(e.type == 'durationchange'){
			updateDuration()
		}
		if(e.type == 'waiting'){
			html.info.style.opacity = 1;
		}
		if(e.type == 'canplay' || e.type == 'playing' || e.type == 'canplaythrough'){
			html.info.style.opacity = 0;
		}
	}

	function reportEvents(e){
		if(html.settings.events) { html.settings.events(e)}
	}


	function volumeEvents(e){
		if(e.type == 'touchend'){
			toggleVolume();
			e.stopPropagation();
			e.preventDefault();
		}
		if(e.type == 'click'){
			toggleVolume();
		}
		if(e.type == 'mouseover'){
			//showVolume();
		}
	}

	function volumeLeave(e){
		if(!html.volume_drag){
			hideVolume(0.5);
		}
	}

	function showVolume(){
		clearTimeout(html.volume_timeout);
		html.addClass('volume-show');
	}

	function hideVolume(n=1){
		clearTimeout(html.volume_timeout);
		html.volume_timeout = setTimeout(() => {
			html.removeClass('volume-show')
		},n*1000)
	}

	
	function volumeSlider(e){
		if(e.type == 'start'){
			html.volume_drag = true;
		}
		else if(e.type == 'end'){
			html.volume_drag = false;
			hideVolume(1);
		}
		else {
			//media.volume = e.prozX;
			if(html.gainNode) { html.gainNode.gain.value = e.prozX}
			else { media.volume = e.prozX}
			reportEvents({type:'media_volume', target:media, value:e.prozX})
			media.current_volume = e.prozX;
			showControls();
			showVolume();
		}
	}

	function timelineSlider(e){
		if(duration > 0) {
			if(e.type == 'start'){
				html.timeline_drag = true;
				html.addClass('widget-show');
				html.pauseMem = media.paused;
				media.pause();
			}
			else if(e.type == 'end'){
				html.timeline_drag = false;
				if(!html.pauseMem){
					media.play();
				}
				if(e.isTouch){
					clearTimeout(html.widget_timeout);
					html.widget_timeout = setTimeout(()=>{ html.removeClass('widget-show');},1000)
				}
			}
			html.widget_x = e.x;
			media.currentTime = duration * e.prozX;
		}
		showControls();
	}

	function widgetEvents(e){
		if(settings.hideControls){ html.removeClass('widget-show'); return;}
		if(e.type == 'mouseover'){
			html.addClass('widget-show');
		}
		else if(e.type == 'mouseout'){
			html.removeClass('widget-show');
		}
		else if(e.type == 'mousemove'){
			html.widget_x = e.offsetX;
		}
	}


	function update(){
		if(!html){ return;}
		if(!html.isVisible){ return; }
		if(!html.updateMute){
			if(html.last_widget_x != html.widget_x){
				setWidget(html.widget_x);
			}
			let vol = 0;
			if(html.gainNode){
				vol = html.gainNode.gain.value;
			}
			else {
				vol = media.volume;
			}
			if(html.last_volume_proz != vol){
				html.volume_proz.style.width = (vol*100) + '%';
				html.last_volume_proz = vol;
			}
			if(media.last_state != media.paused){
				media.last_state = media.paused;
				if(media.paused){
					html.removeClass('playing');
				}
				else {
					html.addClass('playing');
				}
			}
			if(duration < media.currentTime){
				//updateDuration(media.currentTime);
			}
			if(html.last_time != html.media.currentTime){
				setTime(html.media.currentTime, html.time);
				html.timeline_proz.style.width = ((media.currentTime / duration)*100) + '%';
				html.last_time = html.media.currentTime;
			}
		}
		requestAnimationFrame(update)
	}

	function showControls(e){
		if(settings.hideControls) { return;}
		html.addClass('controls-show');
		hideControls(3);
	}

	function hideControls(n=1){
		if(html.settings.outside_control){ return;}
		clearTimeout(html.control_timeout);
		html.control_timeout = setTimeout(() => {
			if(!media.paused || html.settings.hideControls){
				html.removeClass('controls-show');
				if(html.isOver){
					document.body.style.cursor = 'none';
				}
			}
			else {
				hideControls(3);
			}
		},n*1000)
	}


	
	function setWidget(x){
		let val = x + html.timeline.offsetLeft + html.bottom.offsetLeft;
		html.widget.style.left = `${val}px`;
		let proz = x / (html.timeline.offsetWidth);
		let time = proz * duration;
		setTime(proz * duration, html.widget);
		return time;
	}

	function setTime(time, target){
		let playtime = ut.playTime(time*1000).minsec;
		if(target.last_playtime != playtime ){
			target.last_playtime = playtime;
			target.innerText = playtime;
		}
		return playtime;
	}


	function stageEvents(e) { 
		if(e.type == 'touchmove'){
			html.muteTouchEnd = true;
		}
		if(e.type == 'touchend'){
			if(html.muteTouchEnd){
				html.muteTouchEnd = false;
				return;
			}
			if(e.target.hasClass('controls')){
				e.preventDefault();
				if(html.hasClass('controls-show')){
					togglePlay();
					hideControls(1);
				}
				else {
					showControls();
				}
			}
		}
		if(e.type == 'click'){
			if(e.target.hasClass('controls')){
				if(e.detail == 1){
					clearTimeout(html.stageclick_timeout);
					html.stageclick_timeout = setTimeout(togglePlay, 200);
					html.stageclick_mem = media.paused;
				}
				else {
					clearTimeout(html.stageclick_timeout);
					if(media.paused != html.stageclick_mem){
						togglePlay();
					}
					toggleFullscreen();
				}
			}
		}
		if(e.type == 'mouseover'){
			html.isOver = true;
		}
		if(e.type == 'mouseleave'){
			html.isOver = false;
			hideControls(1);
			hideVolume(0.5);
		}
		if(e.type == 'mousemove'){
			html.isOver = true;
			showControls();
		}
		
	}

	function toggleFullscreen(e){
		if(e?.stopPropagation) { e.stopPropagation(); }
		if(!html.isFullscreen){
			if(!ut.enterFullscreen(html)){
				media.webkitEnterFullScreen();
			}
			html.isFullscreen = true;
		}
		else {
			ut.exitFullscreen(html);
			html.isFullscreen = false;
		}
	}

	function createAudioNode(global_audio_context, global_gain){
		if(!html.gainNode){
			html.ctx = global_audio_context;
			html.audioCtx_source = html.ctx.createMediaElementSource(media);
			html.gainNode = html.ctx.createGain();
			html.gainNode.gain.value = 1;
			media.volume = 1;
			html.audioCtx_source.connect(html.gainNode);
			html.gainNode.connect(global_gain);
		}

		if(settings?.visualizer && !html.visualizer){
			html.analyser = global_audio_context.createAnalyser();
			html.gainNode.connect(html.analyser);
			html.visualizer = nui.audioVisualizer(html.analyser, html.playpause, {bands:4, width:150, height:100});
		}
	}

	function togglePlay(e){
		if(window.nui?.css_vars['--color-highlight']){
			ut.setCssVar("--media-bar-proz-playing", nui.css_vars['--color-highlight'].value);
		}
		if(e?.stopPropagation) { e.stopPropagation(); }
		if(media.paused){
			reportEvents({type:'media_playing', target:media })
			if(html.ctx) { html.ctx.resume();}
			media.play();
			if(pause_other_players) { pauseOthers(); }
		}
		else {
			reportEvents({type:'media_paused', target:media })
			media.pause();
		}
	}

	function pauseOthers(){
		for(let key in window.nui_media_active_players){
			if(key != html.player_id){
				if(!window.nui_media_active_players[key].isBackgroundAudio){
					window.nui_media_active_players[key].media.pause();
				}
			}
		}
	}

	function toggleVolume() { clearTimeout(html.volume_timeout); html.toggleClass('volume-show')}
	function fb(o) { if(verbose) { console.log('%c MP ', "background:gray;", o)}}
	function windowEvents(e) { document.body.style.cursor = null; }

	html.togglePlay = togglePlay;
	html.showControls = showControls;
	return html;
}


function checkCSS(url, prop){
	return new Promise(async (resolve, reject) => {
		if(!css_vars){
			css_vars = ut.getCssVars();
			if(!css_vars[prop]){
				console.log('Injecting ' + url)
				await ut.headImport({url:url, type:'css'});
			}
			css_vars = ut.getCssVars();
			console.log(css_vars[prop].value);
			resolve();
		}
		else {
			resolve();
		}
	})
}

function renderHTML(){
	let html = ut.htmlObject( /*html*/ `
		<div class="nui-media controls-show" style="opacity: 0">
			<div class="wrap">
				<div class="info">${ut.icon('sync')}</div>
				<div class="fullscreen">${ut.icon('fullscreen')}</div>
				<div class="widget">0:00</div>
				<div class="controls">
					<div class="bottom">
						<div class="playpause">
							${ut.icon('play')}
							${ut.icon('pause')}
						</div>
						<div class="timeline">
							<div class="bar">
								<div class="proz"></div>
							</div>
						</div>
						<div class="time">0:00</div>
						<div class="duration">0:00</div>
						<div class="volume">
							<div class="bar">
								<div class="proz"></div>
							</div>
						</div>
						<div class="volume_icon">${ut.icon('volume')}</div>
					</div>
				</div>
				<div class="bottom_shade"></div>
			</div>
		</div>
	`)
	return html;
}

export default mediaPlayer;