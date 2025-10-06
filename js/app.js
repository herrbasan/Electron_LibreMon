'use strict';
const path = require('path');
const {app, Menu, Tray, ipcMain, protocol, globalShortcut, screen} = require('electron');
const helper = require('./electron_helper/helper_new.js');
const squirrel_startup = require('./squirrel_startup.js');

const {spawn, execFile, execSync} = require("child_process");
const _fs = require('fs');
const fs = _fs.promises;

//app.commandLine.appendSwitch('high-dpi-support', 'false');
//app.commandLine.appendSwitch('force-device-scale-factor', '1');
//app.commandLine.appendSwitch('--js-flags', '--experimental-module');

squirrel_startup().then(({ret, cmd}) => { if(ret) { app.quit(); return; } init(cmd); });

let main_env = {};
let stage;
let widget;
let isPackaged = app.isPackaged;
let app_path = app.getAppPath();
let base_path = app_path;
if (isPackaged) { base_path = path.dirname(base_path); }

let libreRunning = false;
let libreTimeout;
let proc;
let selection_change = 0;
let userConfigMain;

function getLoginItemOptions(){
	let loginPath = process.execPath;
	let args = [];
	if(process.platform === 'win32' && isPackaged){
		const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
		if(_fs.existsSync(updateExe)){
			loginPath = updateExe;
			args = ['--processStart', path.basename(process.execPath)];
		}
	}
	return { path: loginPath, args };
}

function isLoginItemEnabled(){
	const opts = getLoginItemOptions();
	let info = app.getLoginItemSettings({ path: opts.path, args: opts.args });
	return info.openAtLogin;
}

function setLoginItemEnabled(enabled){
	const opts = getLoginItemOptions();
	const settings = {
		openAtLogin: enabled,
		openAsHidden: true,
		path: opts.path,
		args: opts.args
	};
	app.setLoginItemSettings(settings);
	fb('Login item settings updated:', settings);
	if(userConfigMain){
		const currentConfig = userConfigMain.get() || {};
		if(currentConfig.start_at_login !== enabled){
			userConfigMain.set({ ...currentConfig, start_at_login: enabled });
		}
	}
}

async function init(cmd){
	fb('APP SET_ENV');
	main_env = await helper.tools.readJSON(path.join(app_path, 'env.json'));
	
	fb('--------------------------------------');
	process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;
	global.app_path = app_path;
	global.main_env = main_env;
	global.isPackaged = isPackaged;
	global.base_path = base_path;

	fb('Electron Version: ' + process.versions.electron);
	fb('Node Version: ' + process.versions.node);
	fb('Chrome Version: ' + process.versions.chrome);
	fb('--------------------------------------');
	
	ipcMain.handle('fb', (e, req) => console.log(req));
	ipcMain.handle('selection_change', (e, req) => {selection_change = req; console.log(selection_change)});
	ipcMain.handle('change_timestamp', (e, req) => { return selection_change; })
	app.whenReady().then(appStart).catch((err) => { throw err});
}

async function appStart(){
    userConfigMain = await helper.config.initMain('config', {
        "ingest_server": "http://192.168.0.100:4440/computer_stats",
        "poll_rate": 1000,
		"intel_arc": false,
        "sensor_selection": [],
        "widget_bounds": { "width": 1200, "height": 800 },
		"start_at_login": true
    });

	const cfg = userConfigMain.get() || {};
	const desiredAutoStart = cfg.start_at_login !== false;
	if(cfg.start_at_login === undefined){
		userConfigMain.set({ ...cfg, start_at_login: desiredAutoStart });
	}
	if(desiredAutoStart !== isLoginItemEnabled()){
		setLoginItemEnabled(desiredAutoStart);
	}

	await initApp();
	await initWidget();
	startLibre();
	loop();
}

function loop(){
	if(stage){ stage.close();}
	stage = null;
	initStage();
	setTimeout(loop,600000);
}


function startLibre(){
	fb('Check for LibreHardwareMonitor');
	clearTimeout(libreTimeout);
	libreRunning = false;

    try {
        execSync("tasklist | findstr \"LibreHardwareMonitor.exe\"")
		libreRunning = true;
    } catch(err) {
        libreRunning = false;
    };

    if(!libreRunning){
        fb('Launching LibreHardwareMonitor');
        spawnExe().then(success => { if(success) { fb('Libre Running') } else { startUpFail(); }})
    }
    else {
        fb('LibreHardwareMonitor allready running')
    }
}

function spawnExe(){
    return new Promise(async (resolve, reject) => {
		let defaults_fp = path.join(base_path, 'bin', 'libre_defaults.xml');
		let config_fp = path.join(base_path, 'bin', 'LibreHardwareMonitor', 'LibreHardwareMonitor.config');
		let temp = await fs.readFile(defaults_fp);
		let copy = await fs.writeFile(config_fp, temp);
        proc = spawn(path.join(base_path, 'bin', 'LibreHardwareMonitor', 'LibreHardwareMonitor.exe'), {detached:true});
        proc.once('error', () => resolve(false))
        proc.once('spawn', () => resolve(true))
    })
}

function startUpFail(){
    fb('Error: no LibreHardwareMonitor');
	clearTimeout(libreTimeout);
    libreTimeout = setTimeout(()=>init(),15000); 
}


function initApp(){
	return new Promise(async (resolve, reject) => {
		fb('Init App');
		//Menu.setApplicationMenu( Menu.buildFromTemplate( [{ label:'File', submenu: [{role: 'quit'}]}] ) );
		Menu.setApplicationMenu( null );

		let icon_path = path.join(base_path, 'sysmon_icon.ico');
		let tray = new Tray(icon_path);
		const contextMenu = Menu.buildFromTemplate([
			{ label: 'Show Settings', click: (e) => { stage.show() }},
			{ label: 'Show Widget', click: (e) => { widget.show() }},
			{ type: 'separator' },
			{ 
                label: 'Start at Login', 
                type: 'checkbox',
				checked: isLoginItemEnabled(),
				click: (menuItem) => {
					setLoginItemEnabled(menuItem.checked);
				}
            },
			{ label: 'Reset Widget Position', click: (e) => { 
				if (!widget) return;
				const primaryDisplay = screen.getPrimaryDisplay();
				const { width, height } = widget.getBounds();
				const x = Math.floor(primaryDisplay.workArea.x + (primaryDisplay.workArea.width - width) / 2);
				const y = Math.floor(primaryDisplay.workArea.y + (primaryDisplay.workArea.height - height) / 2);
				widget.setPosition(x, y);
			}},
			{ label: 'Exit', role:'quit'}
		])
		tray.setToolTip('System Monitor')
		tray.setContextMenu(contextMenu)
		tray.on('click', widgetToggle);
		resolve();
	})
}

function initWidget(){
	return new Promise(async (resolve, reject) => {
		fb('Init Widget');
		widget = await helper.tools.browserWindow('frameless', { webPreferences:{preload:path.join(__dirname, 'widget.js')}, skipTaskbar:true, transparent:true, show:false, file:'./html/widget.html'})
		if(!isPackaged){widget.toggleDevTools();}
		resolve(widget);
	})
}

function initStage(){
	return new Promise(async (resolve, reject) => {
		fb('Init Stage');
		stage = await helper.tools.browserWindow('frameless', { webPreferences:{preload:path.join(__dirname, 'stage.js')}, show:false, file:'./html/stage.html'})
		if(!isPackaged){ stage.toggleDevTools(); }
		resolve(stage);
	})
}

function stageToggle(){
	if(stage.isVisible()){ stage.hide(); }
	else { stage.show();}
}

function widgetToggle(){
	if(widget.isVisible()){ widget.hide(); }
	else { widget.show();}
}
function fb(o, context='main'){ 
    console.log(context + ' : ', o);
	if(widget?.webContents){
		widget.webContents.send('fb', {msg:o, context:context});
	}
}



module.exports.fb = fb;