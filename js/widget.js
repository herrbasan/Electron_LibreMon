'use strict';
const { ipcRenderer } = require( "electron" );
const path = require('path');
const helper = require('./electron_helper/helper_new.js');

let g = {};
let userConfig;

let win = helper.window;
let tools = helper.tools;

if(window) { window.electron_widget = {init:init, helper:helper, openSettings:openSettings} }

async function openSettings() {
	await ipcRenderer.invoke('open_settings');
}

async function init(){
	console.log('App Init');

    userConfig = await helper.config.initRenderer('config', (updatedConfig) => {
        console.log('Widget config updated', updatedConfig);
        // Update empty state when config changes
        if(window.updateEmptyState) window.updateEmptyState(updatedConfig);
    });
    g.config = userConfig.get();
    
    // Expose config for empty state detection
    window.getWidgetConfig = () => g.config;

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
	ipcRenderer.on('reset_widget', () => { 
		if(window.resetWidget) window.resetWidget();
	});
	win.hook_event('focus', winEvents);
	win.hook_event('blur', winEvents);
	win.hook_event('move', winEvents);
	win.hook_event('resize', winEvents);
	win.getId().then(console.log);

	// Initialize custom resize handles for transparent frameless window
	initResizeHandles();
}

let resizeMoveTimeout;

function winEvents(sender, e){
	if(e.type == 'focus'){
		console.log('focus');
		const sysmon = ut.el('.sysmon');
		const emptyState = ut.el('.empty-state');
		if(sysmon) sysmon.style.backgroundColor = 'rgba(0,0,0,0.2)';
		if(emptyState) emptyState.style.backgroundColor = 'rgba(0,0,0,0.2)';
	}
	else if(e.type == 'blur'){
		console.log('blur');
		const sysmon = ut.el('.sysmon');
		const emptyState = ut.el('.empty-state');
		if(sysmon) sysmon.style.backgroundColor = null;
		if(emptyState) emptyState.style.backgroundColor = null;
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

// Custom resize functionality for transparent frameless windows
function initResizeHandles() {
	// Wait a bit for DOM to be ready if needed
	setTimeout(() => {
		const handles = document.querySelectorAll('.resize-handle');
		console.log('Found resize handles:', handles.length);
		
		handles.forEach(handle => {
			handle.addEventListener('mousedown', (e) => {
				e.preventDefault();
				e.stopPropagation();
				
				console.log('Resize started, direction:', handle.className);
				
				// Disable text selection during resize
				document.body.style.userSelect = 'none';
				document.body.style.webkitUserSelect = 'none';
				
				const direction = handle.className.replace('resize-handle ', '');
				const startX = e.screenX;
				const startY = e.screenY;
				
				win.getBounds().then(startBounds => {
					console.log('Start bounds:', startBounds);
					const startWidth = startBounds.width;
					const startHeight = startBounds.height;
					const startLeft = startBounds.x;
					const startTop = startBounds.y;
					
					const minWidth = 400;
					const minHeight = 300;
					
					const onMouseMove = (e) => {
						const deltaX = e.screenX - startX;
						const deltaY = e.screenY - startY;
						
						let newBounds = { x: startLeft, y: startTop, width: startWidth, height: startHeight };
						
						// Handle different resize directions
						if (direction.includes('right')) {
							newBounds.width = Math.max(minWidth, startWidth + deltaX);
						}
						if (direction.includes('left')) {
							const newWidth = Math.max(minWidth, startWidth - deltaX);
							newBounds.width = newWidth;
							newBounds.x = startLeft + (startWidth - newWidth);
						}
						if (direction.includes('bottom')) {
							newBounds.height = Math.max(minHeight, startHeight + deltaY);
						}
						if (direction.includes('top')) {
							const newHeight = Math.max(minHeight, startHeight - deltaY);
							newBounds.height = newHeight;
							newBounds.y = startTop + (startHeight - newHeight);
						}
						
						win.setBounds(newBounds);
					};
					
					const onMouseUp = () => {
						document.removeEventListener('mousemove', onMouseMove);
						document.removeEventListener('mouseup', onMouseUp);
						
						console.log('Resize ended');
						
						// Re-enable text selection
						document.body.style.userSelect = '';
						document.body.style.webkitUserSelect = '';
					};
					
					document.addEventListener('mousemove', onMouseMove);
					document.addEventListener('mouseup', onMouseUp);
				});
			});
		});
	}, 100);
}

window.stage = {init:init};
