'use strict';
import ut from "./nui_ut.js"
import { gsap } from "./lib/gsap_esm/index.js";
import { Draggable } from "./lib//gsap_esm/Draggable.js";
import { InertiaPlugin } from "./lib//gsap_esm/InertiaPlugin.js";
import { PhysicsPropsPlugin } from "./lib//gsap_esm/PhysicsPropsPlugin.js";
import mediaPlayer from "../nui/nui_media_player.js";

let css_vars = {};
let verbose = true;

/**
 * 
 * @param {object} prop - Properties
 * @param {array} prop.media - List of Gallery Items {name:name url:url}
 * @param {object} prop.settings - List of Images / Videos
 * @param {Element} prop.settings.target - Target to render into
 * @param {boolean} prop.settings.verbose - Verbose logging
 * @param {number} prop.settings.gap - Gap between items
 * @param {boolean} prop.settings.show_bubbles - Show navigation Bubbles
 * @param {boolean} prop.settings.show_info - Show Item Info
 * @param {boolean} prop.settings.show_arrows - Show side Arrows
 * @param {boolean} prop.settings.show_fullscreen - Show Fullscreen Button
 * @param {Function} prop.settings.init_callback - Callback after Render
 * @returns 
 */

function gallery(prop){
    let html = renderHTML();
    html.css_vars = ut.getCssVars();
	if(!html.css_vars['--nui-gallery']){
		fb('Injecting nui_gallery.css')
		ut.headImport({url:'./nui/css/nui_gallery.css', type:'css'}).then(() => {
            html.css_vars = ut.getCssVars();
            renderGallery(html, prop);
        });
	}
    else {
        html.css_vars = ut.getCssVars();
        renderGallery(html, prop);
    }
    return html;
}



function renderGallery(html, prop){
    html.id = ut.id();
    html.settings = prop.settings;
    html.media = prop.media;
    html.show_info = prop.settings.show_info || false;
    html.show_fullscreen = prop.settings.show_fullscreen || false;
    html.show_arrows = prop.settings.show_arrows || false;
    html.show_bubbles = prop.settings.show_bubbles || false;
    verbose = html.settings.verbose || false;
    html.gap = prop.settings.gap || 0;
    html.idx = 0;
    html.max = html.media.length-1;
    html.first = true;
    html.videos = [];
    
    if(!html.show_info){ html.info.style.display = 'none'; }
	if(!html.show_fullscreen){ html.fullscreen.style.display = 'none'; }
    if(!html.show_arrows){ html.arrow_left.style.display = 'none'; }
    if(!html.show_arrows){ html.arrow_right.style.display = 'none'; }
    if(!html.show_bubbles) { html.removeClass('bubbles'); }

    for(let i=0; i<html.media.length; i++){
        let item = html.media[i];
        item.type = ut.getMediaType(item.url);
       
        if(item.type == 'img' || item.type == 'image'){
            item.slide = ut.createElement('div', {classes:'nui-gallery-item loading', target:html.content, style:{left:i*100 + '%'}});
            item.loader = ut.createElement('div', {target:item.slide, classes:'nui-gallery-loader'});
            item.loader_spinner = ut.createElement('div', {target:item.loader, classes:'nui-gallery-spinner'});
            item.img = ut.createElement('img', {attributes:{src:item.url, loading:'lazy'}, target:item.slide})
            item.img.addEventListener('load', (e) => { item.slide.removeClass('loading')}, {once:true})
        }
        if(item.type == 'video'){
            item.slide = ut.createElement('div', {classes:'nui-gallery-item', target:html.content, style:{left:i*100 + '%'}});
            item.slide.appendChild(mediaPlayer({url:item.url, type:'video', hide_fs_button:true}))
            item.vid = item.slide.el('.nui-media');
            html.videos.push(item.vid);
        }
        item.bubble = ut.createElement('div', {classes:'nui-gallery-bubble', target:html.el('.nui-gallery-bubbles')})
        item.bubble.addEventListener('click', (e) => { go(i) });
    }
    html.addEventListener('mousedown', (e) =>  { e.preventDefault(); })
    html.addEventListener('focus', (e) => { html.nui_isFocus = true; })
    html.addEventListener('blur', (e) => { html.nui_isFocus = false; })
    document.body.addEventListener('keydown', keyEvents)
    html.fullscreen.addEventListener('click', (e) => { ut.toggleFullscreen(html)})
    html.trigger.addEventListener('mouseover', showControls);
    document.body.addEventListener('mouseover', (e) => {
        if(!e.target.closest('#'+html.id)){
            hideControls();
        }
    });
    
    
    fb('Init Video Events')
    html.trigger.addEventListener('mousemove', (e) => {
        if(html.media[html.idx].vid){
            html.media[html.idx].vid.showControls();
        }
        showControls();
    })
    html.trigger.addEventListener('touchend', (e) => {
        if(html.media[html.idx].vid){
            html.media[html.idx].vid.showControls();
        }
        showControls();
    })
    

    gsap.registerPlugin(Draggable, PhysicsPropsPlugin, InertiaPlugin);
    if(html.media.length > 1){
		html.gdrag = Draggable.create(html.content, {
            trigger:html.trigger,
			type:'x', 
			edgeResistance:0.7,
			throwProps:true,
			throwResistance: 8000,
			inertia:true,
			force3D: true,
			allowNativeTouchScrolling: false,
			cursor: 'pointer',
			zIndexBoost: false
		})[0];
		html.gdrag.addEventListener('dragstart', dragHandler)
		html.gdrag.addEventListener('dragend', dragHandler)
        html.gdrag.addEventListener('click', dragHandler)
	}

   

    function dragHandler(e){
		if(e.type == 'dragstart'){
			html.isDrag = true;
            pauseVideos();
		}
		if(e.type == 'release' || e.type == 'throwcomplete' || e.type == 'dragend'){
			let endX = Math.abs(html.gdrag.endX);
			html.idx = Math.floor(endX / html.currentWidth);
			html.isDrag = false;
		}
		if(e.type == 'click'){
            console.log(e);
            let xproz = html.gdrag.pointerEvent.offsetX / html.currentWidth;
            if(xproz < 0.2){ if(html.idx > 0){ go(html.idx - 1); }}
            if(xproz > 0.8){ if(html.idx < html.max){ go(html.idx + 1); }}
            if(xproz > 0.2 && xproz < 0.8){
                if(html.media[html.idx].vid){
                    if(!html.media[html.idx].vid.hasClass('controls-show')){
                        html.media[html.idx].vid.showControls();
                    }
                    else {
                        html.media[html.idx].vid.togglePlay();
                    }
                }
            }
		}
	}

    function showControls(n=5000){
        clearTimeout(html.controls_timeout);
        html.controls_timeout = setTimeout(hideControls, n);
        html.controls.style.opacity = 1;
    }

    function hideControls(){
         html.controls.style.opacity = 0;
    }

    function pauseVideos(){
        for(let i=0; i<html.videos.length; i++) { if(!html.videos[i].media.paused) { fb('Pause video: ' + i); html.videos[i].media.pause(); } }
    }

    function go(n){
        html.idx = n;
        pauseVideos();
        gsap.to(html.content, {duration:0.3, x:-(n*html.slide_width), ease:'power2.inOut'})
    }

    function keyEvents(e){
        if(html.nui_isFocus || html.nui_isFullscreen) { 
            if(e.keyCode == 37){
                if(html.idx > 0){ go(html.idx - 1); }
            }
            if(e.keyCode == 39){
                if(html.idx < html.max){ go(html.idx + 1); }
            }
        }
    }
 
    var observer = new IntersectionObserver((e) => {
        html.isVisible = e[0].isIntersecting;
        html.last_idx = -1;
        if(html.first) { init(); }}, { threshold: [0] 
    });
	observer.observe(html);
    
    function init(){
        fb('Gallery Init');
        html.style.opacity = 1;
        html.first = false; 
        html.isVisible = true;
        resize();
        showControls();
        if(html.settings.init_callback){
            html.settings.init_callback();
        }
    }

    function loop(){
        if(html.isVisible){
            resize();
            if(html.idx != html.last_idx){
                fb('Index Change: ' + html.idx);
                html.last_idx = html.idx;

                let item = html.media[html.idx];
                if(item.slide.style.display) { item.slide.style.display = null; }
                if(html.idx != html.max) {
                    if(html.media[html.idx+1].img){
                        html.media[html.idx+1].img.loading = null;
                        html.media[html.idx+1].slide.style.display = null;
                    }
                }
                
                if(item.name) { html.info_name.style.opacity = 1; html.info_name.innerHTML = (html.idx+1) + '/' + (html.max+1) + ' ' + item.name }
                else {
                    html.info_name.style.opacity = 0;
                }
                for(let i=0; i<html.media.length; i++){
                    html.media[i].bubble.removeClass('active');
                }
                item.bubble.addClass('active');

                if(html.idx == 0){ html.arrow_left.style.opacity = 0; }
                else { html.arrow_left.style.opacity = 1; }
                if(html.idx == html.max){ html.arrow_right.style.opacity = 0; }
                else { html.arrow_right.style.opacity = 1; }
                if(html.media[html.idx].vid){
                    if(item.vid.hasClass('controls-show')){
                        html.trigger.style.bottom = item.vid.bottom.offsetHeight + 'px';
                    }
                    else {
                        html.trigger.style.bottom = 0;
                    }
                }
                else {
                    html.trigger.style.bottom = 0;
                }
            }
        }
        requestAnimationFrame(loop)
    }

    function resize(){
        html.currentWidth = html.offsetWidth;
        html.currentHeight = html.offsetHeight;
        if(html.lastWidth != html.currentWidth || html.lastHeight != html.currentHeight){
            html.lastWidth = html.currentWidth;
            html.lastHeight = html.currentHeight;
            html.slide_width = html.currentWidth + html.gap;
            let snaps = [];
            for(let i=0; i<html.media.length; i++){
                html.media[i].slide.style.left = i * html.slide_width + 'px';
                snaps.push(-(i * html.slide_width));
            }
            html.gdrag.vars.snap = snaps;
            gsap.set(html.content, {x:-(html.idx * html.slide_width) + 'px'});
        }
    }

    loop();
    if(html.settings.target) { html.settings.target.appendChild(html)}
    return html;
}



function renderHTML(){
    let html = ut.htmlObject(/*html*/`
        <div class="nui-gallery controls bubbles" tabindex="0">
            <div class="nui-gallery-controls">
                <div class="nui-gallery-fullscreen">${ut.icon('fullscreen')}</div>
                <div class="nui-gallery-info"><div class="nui-gallery-info-name">Some Name</div></div>
                <div class="nui-gallery-arrow left">${ut.icon('arrow')}</div>
                <div class="nui-gallery-arrow right">${ut.icon('arrow')}</div>
            </div>
            <div class="nui-gallery-trigger"></div>
            <div class="nui-gallery-frame">
                <div class="nui-gallery-content"></div>
            </div>
            <div class="nui-gallery-bubbles"></div>
        </div>
    `)
    html.content = html.el('.nui-gallery-content');
    html.controls = html.el('.nui-gallery-controls');
    html.trigger = html.el('.nui-gallery-trigger');
    html.arrow_left = html.el('.nui-gallery-arrow.left');
    html.arrow_right = html.el('.nui-gallery-arrow.right');
    html.fullscreen = html.el('.nui-gallery-fullscreen');
    html.info = html.el('.nui-gallery-info');
    html.info_name = html.info.el('.nui-gallery-info-name');
    return html;
}

function fb(o) { if(verbose) { console.log('%c GAL ', "background:gray;", o)}}

export default gallery;