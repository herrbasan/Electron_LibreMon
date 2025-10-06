'use strict';
const { ipcRenderer } = require( "electron" );
const path = require('path');
const helper = require('./electron_helper/helper_new.js');

let g = {};
let userConfig;

let win = helper.window;
let tools = helper.tools;

if(window) { window.electron_widget = {init:init, helper:helper} }

async function init(){
	console.log('App Init');

    userConfig = await helper.config.initRenderer('config', (updatedConfig) => {
        console.log('Widget config updated', updatedConfig);
    });
    g.config = userConfig.get();

	g.main_env = await helper.global.get('main_env');
	g.app_path = await helper.global.get('app_path');
	g.base_path = await helper.global.get('base_path');
	g.isPackaged = await helper.global.get('isPackaged');

	if(!g.config.widget_bounds) { g.config.widget_bounds = { width:1200, height:800 }; }
	if (g.config.widget_bounds.x && g.config.widget_bounds.y) {
		win.setBounds(g.config.widget_bounds);
	} else {
		win.setSize(g.config.widget_bounds.width, g.config.widget_bounds.height);
		win.center();
	}

	win.show();
	win.focus();
	
    tools.versionInfo();
    window.addEventListener("keydown", onKey);
	

	appStart();
	//ut.el('.nui-title-bar .close').addEventListener('click', hideApp);
	ipcRenderer.on('fb', fb);
	ipcRenderer.on('stats', stats);
	win.hook_event('focus', winEvents);
	win.hook_event('blur', winEvents);
	win.hook_event('move', winEvents);
	win.hook_event('resize', winEvents);
	win.getId().then(console.log);
}

let resizeMoveTimeout;

function winEvents(sender, e){
	if(e.type == 'focus'){
		console.log('focus');
		ut.el('.sysmon').style.backgroundColor = 'rgba(0,0,0,0.2)';
	}
	else if(e.type == 'blur'){
		console.log('blur');
		ut.el('.sysmon').style.backgroundColor = null;
	}
	else if(e.type == 'move' || e.type == 'resize'){
		clearTimeout(resizeMoveTimeout);
		resizeMoveTimeout = setTimeout(storeWinPos, 500);
	}
	else {
		console.log(e);
	}
}

async function storeWinPos(){
    const currentConfig = userConfig.get();
	currentConfig.widget_bounds = await helper.window.getBounds();
    userConfig.set(currentConfig);
	console.log('Stored window position:', currentConfig.widget_bounds);
}

function stats(e, req){
	if(window.renderWidget) { window.renderWidget(req)}
}

function hideApp(){
	win.hide();
}

async function appStart(e, data){
	
}


async function onKey(e) {
	if (e.keyCode == 122) {
		if(await helper.window.isFullScreen()){
			helper.window.setFullScreen(false);
		}
		else {
			helper.window.setFullScreen(true);
		}
	}
	if (e.keyCode == 123) {
		helper.window.toggleDevTools();
	}
	if (e.keyCode == 27) {
		appClose();
	}
}

function appClose(){
	helper.app.exit();
}

function fb(e, data){
	console.log(data);
}

window.stage = {init:init};
