'use strict';
const { ipcRenderer } = require( "electron" );
const path = require('path');
const helper = require('./linked/ElectronHelper.js');

let g = {};

let win = helper.window;
let tools = helper.tools;

if(window) { window.electron_widget = {init:init, helper:helper} }

async function init(){
	console.log('App Init');
	g.main_env = await helper.global.get('main_env');
	g.app_path = await helper.global.get('app_path');
	g.base_path = await helper.global.get('base_path');
	g.isPackaged = await helper.global.get('isPackaged');

    win.setSize(1200,800);
    win.center();
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
	win.getId().then(console.log);
}

function winEvents(sender, e){
	if(e.type == 'focus'){
		console.log('focus');
		ut.el('.sysmon').style.backgroundColor = 'rgba(0,0,0,0.2)';
	}
	if(e.type == 'blur'){
		console.log('blur');
		ut.el('.sysmon').style.backgroundColor = null;
	}
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