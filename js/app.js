'use strict';
const path = require('path');
const {app, Menu, Tray, ipcMain, protocol, globalShortcut, screen} = require('electron');
const helper = require('./electron_helper/helper_new.js');
const squirrel_startup = require('./squirrel_startup.js');

const {spawn, execSync} = require("child_process");
const _fs = require('fs');
const fs = _fs.promises;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
let stageRestartTimeout = null;
let stageCreatedAt = null;

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
	ipcMain.handle('get_config', (e) => { return userConfigMain ? userConfigMain.get() : null; })
	
	ipcMain.handle('update_sensor_groups', async (e, sensorGroups) => {
		try {
			fb('Updating sensor groups...');
			
			// Kill existing LHM instance before applying changes
			if (killLibreProcess()) {
				fb('Existing LibreHardwareMonitor instance terminated');
			} else {
				fb('No running LibreHardwareMonitor instance detected');
			}
			
			// Update user config
			const cfg = userConfigMain.get();
			cfg.sensor_groups = sensorGroups;
			userConfigMain.set(cfg);
			fb('Sensor groups updated in config');
			
			// Wait briefly for process cleanup
			await wait(500);
			
			// Respawn with new config
			spawnExe();
			fb('LibreHardwareMonitor restarted with new sensor groups');
			
			return { success: true };
		} catch (err) {
			fb('Error updating sensor groups: ' + err.message);
			return { success: false, error: err.message };
		}
	})
	
	app.whenReady().then(appStart).catch((err) => { throw err});
}

async function appStart(){
	// Load default config from config.json (single source of truth)
	const defaultConfig = await helper.tools.readJSON(path.join(app_path, 'config.json'));
	
	userConfigMain = await helper.config.initMain('config', defaultConfig);

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
	initStage();
}

function scheduleStageRestart() {
	const RESTART_INTERVAL = 60 * 10 * 1000; // 10 minutes
	
	// Clear any existing timeout to prevent duplicate timers
	if (stageRestartTimeout) {
		clearTimeout(stageRestartTimeout);
		stageRestartTimeout = null;
	}
	
	stageRestartTimeout = setTimeout(() => {
		// Only restart if stage window is not visible (user not actively using it)
		if (stage && !stage.isVisible()) {
			fb('Restarting stage window (scheduled maintenance)');
			stage.destroy();
			stage = null;
			initStage();
		} else {
			// User is actively using settings - reschedule for later
			fb('Stage restart delayed - window is visible');
			scheduleStageRestart();
		}
	}, RESTART_INTERVAL);
}

function startLibre(){
	fb('Check for LibreHardwareMonitor');
	clearTimeout(libreTimeout);

	try {
		const result = execSync("tasklist /FI \"IMAGENAME eq LibreHardwareMonitor.exe\"", {stdio: 'pipe', encoding: 'utf8'});
		libreRunning = result.includes('LibreHardwareMonitor.exe');
	} catch(err) {
		libreRunning = false;
	}

    if(!libreRunning){
        fb('Launching LibreHardwareMonitor');
        spawnExe().then(success => { 
			if(success) { 
				fb('Libre Running');
			} else { 
				startUpFail(); 
			}
		});
    }
    else {
        fb('LibreHardwareMonitor already running - reusing existing instance');
    }
}

function killLibreProcess(){
	if (!proc) {
		return false;
	}

	try {
		proc.kill();
		proc = null;
		libreRunning = false;
		return true;
	} catch (err) {
		fb('proc.kill failed: ' + err.message);
		return false;
	}
}

function spawnExe(){
    return new Promise(async (resolve, reject) => {
		let defaults_fp = path.join(base_path, 'bin', 'libre_defaults.xml');
		let config_fp = path.join(base_path, 'bin', 'LibreHardwareMonitor', 'LibreHardwareMonitor.config');
		
		fb('Reading template: ' + defaults_fp);
		
		// Read default XML template
		let xmlContent = await fs.readFile(defaults_fp, 'utf8');
		
		// Modify XML with sensor group settings from user config
		xmlContent = applySensorGroupsToXml(xmlContent);
		
		fb('Writing config: ' + config_fp);
		
		// Write modified XML to LHM config location
		await fs.writeFile(config_fp, xmlContent, 'utf8');
		
		const exePath = path.join(base_path, 'bin', 'LibreHardwareMonitor', 'LibreHardwareMonitor.exe');
		fb('Spawning: ' + exePath);
		
		proc = spawn(exePath, [], {
			detached: true,
			stdio: 'ignore',
			shell: false,
			windowsHide: true
		});
		
		proc.unref();
		
        proc.once('error', (err) => {
			fb('Spawn error: ' + err.message);
			resolve(false);
		});
        proc.once('spawn', async () => {
			fb('Spawn success');
			resolve(true);
		});
    })
}

function applySensorGroupsToXml(xmlContent) {
	const cfg = userConfigMain ? userConfigMain.get() : {};
	// Support both new 'sensor_groups' and legacy 'sensors' property
	const sensorGroups = cfg.sensor_groups || cfg.sensors || {};
	
	// Default to true if not specified (backward compatibility for existing installations)
	const groups = {
		cpu: sensorGroups.cpu !== false,
		gpu: sensorGroups.gpu !== false,
		memory: sensorGroups.memory !== false,
		motherboard: sensorGroups.motherboard !== false,
		storage: sensorGroups.storage !== false,
		network: sensorGroups.network !== false,
		psu: sensorGroups.psu === true,
		battery: sensorGroups.battery === true,
		fanController: (sensorGroups.fanController || sensorGroups.controller) === true
	};
	
	// Map config keys to XML MenuItem keys
	const menuItemMap = {
		cpu: 'cpuMenuItem',
		gpu: 'gpuMenuItem',
		memory: 'ramMenuItem',
		motherboard: 'mainboardMenuItem',
		storage: 'hddMenuItem',
		network: 'nicMenuItem',
		psu: 'psuMenuItem',
		battery: 'batteryMenuItem',
		fanController: 'fanControllerMenuItem'
	};
	
	// Replace each menuItem value in XML
	for (const [configKey, menuItemKey] of Object.entries(menuItemMap)) {
		const enabled = groups[configKey];
		const pattern = new RegExp(`<add key="${menuItemKey}" value="(true|false)" />`, 'g');
		xmlContent = xmlContent.replace(pattern, `<add key="${menuItemKey}" value="${enabled}" />`);
	}
	
	return xmlContent;
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
		stageCreatedAt = Date.now();
		
		// Schedule restart timer (clears any existing timer first)
		scheduleStageRestart();
		
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