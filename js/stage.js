'use strict';
const { ipcRenderer } = require( "electron" );
const path = require('path');
const helper = require('./electron_helper/helper_new.js');
const libreHardwareMonitor = require('./libre_hardware_monitor_web.js');
const intelArcPoller = require('./intel_arc_poller.js');


let g = {};
let userConfig;

let win = helper.window;
let tools = helper.tools;
let system_info;

if(window) { window.electron_stage = {init:init, selectChange:selectChange} }

async function init(){
	console.log('App Init');

    userConfig = await helper.config.initRenderer('config', (updatedConfig) => {
        g.config = updatedConfig;
        console.log('Stage config updated', updatedConfig);
    });
    g.config = userConfig.get();

	g.main_env = await helper.global.get('main_env');
	g.app_path = await helper.global.get('app_path');
	g.base_path = await helper.global.get('base_path');
	g.isPackaged = await helper.global.get('isPackaged');
	
	// Listen for hardware monitor resets from main process
	ipcRenderer.on('reset_hardware_monitor', () => {
		console.log('Resetting hardware monitor initialization');
		libreHardwareMonitor.resetInitialized();
	});

	console.log(g.config);

	let main_change_timestamp = await ipcRenderer.invoke('change_timestamp');
	g.change_timestamp = main_change_timestamp || Date.now();
	tools.sendToMain('selection_change', g.change_timestamp);
	g.poll_idx = 0;
	
    win.setSize(500,800);
    win.center();
	//win.show();
	//win.focus();
	
    window.addEventListener("keydown", onKey);
	g.loader = nui.loaderShow(ut.el('.nui-app .content'), 'Collecting System Info');
	system_info = await ipcRenderer.invoke('get_system_info'); // Get cached system info from main process
	console.log(system_info);
	appStart();
	ut.el('.nui-title-bar .close').addEventListener('click', hideApp);
}

function hideApp(){
	win.hide();
	if(window.cleanMain){
		window.cleanMain();
	}
}

async function appStart(e, data){
	if(g.config.intel_arc === true){
		g.loader.progress('Initializing Intel Arc');
		await intelArcPoller.initialize();
	}
	g.loader.progress('Poll Start');
	g.loader.kill(1000);
	
	// Create sensor groups UI before starting polling
	createSensorGroupsUI();
	
	// Create ingest server settings UI
	createIngestServerUI();
	
	pollStart();
}

function createSensorGroupsUI(){
	const settingsContainer = document.querySelector('.hm_settings');
	
	// Get current sensor groups from config (support both new and legacy format)
	const sensorGroups = g.config.sensor_groups || g.config.sensors || {};
	
	const html = /*html*/`
		<div class="sensor-groups-card">
			<div class="hm_head">Hardware Sensor Groups</div>
			<p style="font-size: 13px; opacity: 0.7; margin: 8px 0 12px 0;">
				Configure which hardware types to monitor. Changes require restarting LibreHardwareMonitor (~3s interruption).
			</p>
			
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
				<div class="nui-checkbox">
					<input type="checkbox" id="sg-cpu" ${sensorGroups.cpu !== false ? 'checked' : ''}>
					<label for="sg-cpu">CPU</label>
				</div>
				<div class="nui-checkbox">
					<input type="checkbox" id="sg-gpu" ${sensorGroups.gpu !== false ? 'checked' : ''}>
					<label for="sg-gpu">GPU</label>
				</div>
				<div class="nui-checkbox">
					<input type="checkbox" id="sg-memory" ${sensorGroups.memory !== false ? 'checked' : ''}>
					<label for="sg-memory">Memory</label>
				</div>
				<div class="nui-checkbox">
					<input type="checkbox" id="sg-motherboard" ${sensorGroups.motherboard !== false ? 'checked' : ''}>
					<label for="sg-motherboard">Motherboard</label>
				</div>
				<div class="nui-checkbox">
					<input type="checkbox" id="sg-storage" ${sensorGroups.storage !== false ? 'checked' : ''}>
					<label for="sg-storage">Storage</label>
				</div>
				<div class="nui-checkbox">
					<input type="checkbox" id="sg-network" ${sensorGroups.network !== false ? 'checked' : ''}>
					<label for="sg-network">Network</label>
				</div>
				<div class="nui-checkbox">
					<input type="checkbox" id="sg-psu" ${sensorGroups.psu === true ? 'checked' : ''}>
					<label for="sg-psu">PSU</label>
				</div>
				<div class="nui-checkbox">
					<input type="checkbox" id="sg-battery" ${sensorGroups.battery === true ? 'checked' : ''}>
					<label for="sg-battery">Battery</label>
				</div>
				<div class="nui-checkbox">
					<input type="checkbox" id="sg-fanController" ${sensorGroups.fanController === true ? 'checked' : ''}>
					<label for="sg-fanController">Fan Controller</label>
				</div>
			</div>
			
			<button id="sg-apply-btn" class="nui_button primary" style="width: 100%; padding: 10px; margin-top: 8px;" disabled>
				Apply Changes
			</button>
			
			<div id="sg-status" style="margin-top: 12px; padding: 8px 12px; border-radius: 4px; font-size: 13px; display: none;"></div>
		</div>
		<div style="border-bottom: solid thin var(--color-text-shade0); margin: 16px 0;"></div>
	`;
	
	settingsContainer.insertAdjacentHTML('afterbegin', html);
	
	// Store original state for change detection
	g.originalSensorGroups = {...sensorGroups};
	
	// Add change listeners to all checkboxes
	const checkboxes = settingsContainer.querySelectorAll('[id^="sg-"]');
	checkboxes.forEach(cb => {
		if(cb.type === 'checkbox') {
			cb.addEventListener('change', onSensorGroupChange);
		}
	});
	
	// Add apply button listener
	const applyBtn = settingsContainer.querySelector('#sg-apply-btn');
	applyBtn.addEventListener('click', applySensorGroupChanges);
}

function onSensorGroupChange(){
	const settingsContainer = document.querySelector('.hm_settings');
	const applyBtn = settingsContainer.querySelector('#sg-apply-btn');
	
	// Check if any changes were made
	const current = {
		cpu: document.getElementById('sg-cpu').checked,
		gpu: document.getElementById('sg-gpu').checked,
		memory: document.getElementById('sg-memory').checked,
		motherboard: document.getElementById('sg-motherboard').checked,
		storage: document.getElementById('sg-storage').checked,
		network: document.getElementById('sg-network').checked,
		psu: document.getElementById('sg-psu').checked,
		battery: document.getElementById('sg-battery').checked,
		fanController: document.getElementById('sg-fanController').checked
	};
	
	const changed = JSON.stringify(current) !== JSON.stringify(g.originalSensorGroups);
	applyBtn.disabled = !changed;
}

async function applySensorGroupChanges(){
	const settingsContainer = document.querySelector('.hm_settings');
	const applyBtn = settingsContainer.querySelector('#sg-apply-btn');
	const statusDiv = settingsContainer.querySelector('#sg-status');
	
	// Collect current checkbox states
	const sensorGroups = {
		cpu: document.getElementById('sg-cpu').checked,
		gpu: document.getElementById('sg-gpu').checked,
		memory: document.getElementById('sg-memory').checked,
		motherboard: document.getElementById('sg-motherboard').checked,
		storage: document.getElementById('sg-storage').checked,
		network: document.getElementById('sg-network').checked,
		psu: document.getElementById('sg-psu').checked,
		battery: document.getElementById('sg-battery').checked,
		fanController: document.getElementById('sg-fanController').checked
	};
	
	// Show loading state
	applyBtn.disabled = true;
	applyBtn.innerText = 'Applying...';
	statusDiv.style.display = 'block';
	statusDiv.style.background = 'rgba(255, 152, 0, 0.2)';
	statusDiv.style.border = '1px solid rgba(255, 152, 0, 0.5)';
	statusDiv.style.color = '#FF9800';
	statusDiv.innerText = 'Restarting LibreHardwareMonitor... (~3 seconds)';
	
	try {
		// Call IPC handler to update sensor groups
		const result = await ipcRenderer.invoke('update_sensor_groups', sensorGroups);
		
		if(result.success) {
			// Update stored original state
			g.originalSensorGroups = {...sensorGroups};
			g.config.sensor_groups = sensorGroups;
			
			// Refresh sensors list immediately with new filter
			let sensors = await poll(g.config.sensor_selection);
			let data = { 
				uuid:system_info.system.uuid,
				name:system_info.os.hostname,
				os:system_info.os.distro,
				ram:system_info.memory.total,
				sensors:sensors,
				time:Date.now(),
				change:g.change_timestamp, 
			}
			tools.sendToId(1, 'stats', data);
			tools.sendToId(1, 'reset_widget');
			
			// Show success message
			statusDiv.style.background = 'rgba(76, 175, 80, 0.2)';
			statusDiv.style.border = '1px solid rgba(76, 175, 80, 0.5)';
			statusDiv.style.color = '#4CAF50';
			statusDiv.innerText = '✓ Sensor groups updated successfully!';
			
			applyBtn.innerText = 'Apply Changes';
			
			// Hide success message after 3 seconds
			setTimeout(() => {
				statusDiv.style.display = 'none';
			}, 3000);
		} else {
			throw new Error(result.error || 'Unknown error');
		}
	} catch(err) {
		// Show error message
		statusDiv.style.background = 'rgba(244, 67, 54, 0.2)';
		statusDiv.style.border = '1px solid rgba(244, 67, 54, 0.5)';
		statusDiv.style.color = '#F44336';
		statusDiv.innerText = '✗ Error: ' + err.message;
		
		applyBtn.innerText = 'Apply Changes';
		applyBtn.disabled = false;
	}
}

function createIngestServerUI(){
	const settingsContainer = document.querySelector('.hm_settings');
	
	const enableIngest = g.config.enable_ingest !== false; // Default true for backward compatibility
	const ingestServer = g.config.ingest_server || '';
	
	const html = /*html*/`
		<div class="ingest-server-card">
			<div class="hm_head">Data Reporting</div>
			<p style="font-size: 13px; opacity: 0.7; margin: 8px 0 12px 0;">
				Send hardware statistics to a centralized server for multi-machine monitoring.
			</p>
			
			<div class="nui-checkbox" style="margin-bottom: 12px;">
				<input type="checkbox" id="ingest-enable" ${enableIngest ? 'checked' : ''}>
				<label for="ingest-enable">Enable data reporting</label>
			</div>
			
			<div style="margin-bottom: 12px;">
				<label for="ingest-url" style="display: block; font-size: 13px; margin-bottom: 4px; opacity: 0.9;">Server URL</label>
				<input type="text" id="ingest-url" class="nui_input" value="${ingestServer}" 
					placeholder="http://192.168.1.100:4440/computer_stats" 
					style="width: 100%; padding: 8px; background: var(--color-bg-shade1); border: 1px solid var(--color-text-shade0); border-radius: 4px; color: var(--color-text);"
					${!enableIngest ? 'disabled' : ''}>
				<div id="ingest-url-error" style="font-size: 12px; color: #F44336; margin-top: 4px; display: none;"></div>
			</div>
			
			<button id="ingest-save-btn" class="nui_button primary" style="width: 100%; padding: 10px;" disabled>
				Save Settings
			</button>
			
			<div id="ingest-status" style="margin-top: 12px; padding: 8px 12px; border-radius: 4px; font-size: 13px; display: none;"></div>
		</div>
	`;
	
	settingsContainer.insertAdjacentHTML('beforeend', html);
	
	// Store original values
	g.originalIngestSettings = {
		enable_ingest: enableIngest,
		ingest_server: ingestServer
	};
	
	// Add event listeners
	const enableCheckbox = document.getElementById('ingest-enable');
	const urlInput = document.getElementById('ingest-url');
	const saveBtn = document.getElementById('ingest-save-btn');
	
	enableCheckbox.addEventListener('change', (e) => {
		urlInput.disabled = !e.target.checked;
		onIngestSettingsChange();
	});
	
	urlInput.addEventListener('input', onIngestSettingsChange);
	saveBtn.addEventListener('click', saveIngestSettings);
}

function validateURL(url){
	if(!url || url.trim() === '') return { valid: true, url: '' }; // Empty is valid (disables reporting)
	
	try {
		// Handle backslash escaping from JSON
		url = url.replace(/\\\\/g, '/');
		
		const parsed = new URL(url);
		if(parsed.protocol !== 'http:' && parsed.protocol !== 'https:'){
			return { valid: false, error: 'URL must use http:// or https://' };
		}
		return { valid: true, url: url };
	} catch(e) {
		return { valid: false, error: 'Invalid URL format' };
	}
}

function onIngestSettingsChange(){
	const enableCheckbox = document.getElementById('ingest-enable');
	const urlInput = document.getElementById('ingest-url');
	const saveBtn = document.getElementById('ingest-save-btn');
	const errorDiv = document.getElementById('ingest-url-error');
	
	const enable = enableCheckbox.checked;
	const url = urlInput.value.trim();
	
	// Validate URL if enabled
	let isValid = true;
	if(enable && url) {
		const validation = validateURL(url);
		if(!validation.valid){
			errorDiv.textContent = validation.error;
			errorDiv.style.display = 'block';
			isValid = false;
		} else {
			errorDiv.style.display = 'none';
		}
	} else {
		errorDiv.style.display = 'none';
	}
	
	// Check if settings changed
	const changed = enable !== g.originalIngestSettings.enable_ingest || 
	                url !== g.originalIngestSettings.ingest_server;
	
	saveBtn.disabled = !changed || !isValid;
}

async function saveIngestSettings(){
	const enableCheckbox = document.getElementById('ingest-enable');
	const urlInput = document.getElementById('ingest-url');
	const saveBtn = document.getElementById('ingest-save-btn');
	const statusDiv = document.getElementById('ingest-status');
	
	const enable = enableCheckbox.checked;
	let url = urlInput.value.trim();
	
	// Validate URL
	const validation = validateURL(url);
	if(!validation.valid){
		statusDiv.style.display = 'block';
		statusDiv.style.background = 'rgba(244, 67, 54, 0.2)';
		statusDiv.style.border = '1px solid rgba(244, 67, 54, 0.5)';
		statusDiv.style.color = '#F44336';
		statusDiv.innerText = '✗ ' + validation.error;
		return;
	}
	
	url = validation.url;
	
	// Show saving state
	saveBtn.disabled = true;
	saveBtn.innerText = 'Saving...';
	
	try {
		// Update config via IPC
		const result = await ipcRenderer.invoke('update_config', {
			enable_ingest: enable,
			ingest_server: url
		});
		
		if(result.success) {
			// Update local config and original state
			g.config.enable_ingest = enable;
			g.config.ingest_server = url;
			g.originalIngestSettings = { enable_ingest: enable, ingest_server: url };
			
			// Show success message
			statusDiv.style.display = 'block';
			statusDiv.style.background = 'rgba(76, 175, 80, 0.2)';
			statusDiv.style.border = '1px solid rgba(76, 175, 80, 0.5)';
			statusDiv.style.color = '#4CAF50';
			statusDiv.innerText = '✓ Settings saved successfully!';
			
			saveBtn.innerText = 'Save Settings';
			
			// Hide success message after 3 seconds
			setTimeout(() => {
				statusDiv.style.display = 'none';
			}, 3000);
		} else {
			throw new Error(result.error || 'Failed to save settings');
		}
	} catch(err) {
		// Show error message
		statusDiv.style.display = 'block';
		statusDiv.style.background = 'rgba(244, 67, 54, 0.2)';
		statusDiv.style.border = '1px solid rgba(244, 67, 54, 0.5)';
		statusDiv.style.color = '#F44336';
		statusDiv.innerText = '✗ Error: ' + err.message;
		
		saveBtn.innerText = 'Save Settings';
		saveBtn.disabled = false;
	}
}

async function pollStart(){
	console.log('App Start');
	if(!g.isPackaged){
		console.log('Write Sample');
		let out = {};
		let bench = Date.now();
		out.libre_info = await poll();
		out.system_info = system_info;
		out.took = Date.now() - bench;
		await tools.writeJSON(path.join(g.app_path, 'temp.json'), out);
	}
	window.poll = poll;
	window.main(g.config);
	loop();
}

async function loop(){
	g.poll_idx++;
	let sensors = await poll(g.config.sensor_selection);
	let data = { 
		uuid:system_info.system.uuid,
		name:system_info.os.hostname,
		os:system_info.os.distro,
		ram:system_info.memory.total,
		sensors:sensors,
		time:Date.now(),
		change:g.change_timestamp, 
	}
	tools.sendToId(1, 'stats', data);
	sendToServer(data); // Fire and forget
	clearTimeout(g.poll_timeout);
	g.poll_timeout = setTimeout(loop, g.config.poll_rate);
}

async function sendToServer(data){
	// Skip if disabled or invalid URL
	if(!g.config.enable_ingest || g.mute_fetch) { return; }
	if(!g.config.ingest_server || g.config.ingest_server.trim() === '') { return; }
	
	g.mute_fetch = true;
	try {
		await ut.jfetch(g.config.ingest_server, {stats:JSON.stringify(data)}, {credentials: 'same-origin', method: 'POST', timeout:10000});
	}
	catch(e){
		// Fail quietly
	}
	data = null;
	g.mute_fetch = false;
}

async function poll(filter){
	return new Promise(async (resolve, reject) => {
		// Poll both LibreHardwareMonitor and Intel Arc in parallel (Fast)
		const [libreData, intelArcData] = await Promise.all([
			libreHardwareMonitor.poll(),
			intelArcPoller.poll().catch(() => null) // Graceful fallback if Intel Arc fails (Robust)
		]);

		let ret = libreData || {}; // Start with LibreHardwareMonitor data

		// Merge Intel Arc data if available (Slim - only add if present)
		if (intelArcData && intelArcData.gpu) {
			ret.gpu = ret.gpu || [];
			ret.gpu.push(...intelArcData.gpu);
		}
		if(window.pushData && await win.isVisible()){
			ret.poll_idx = g.poll_idx; 
			window.pushData(ret);
		}
		if(ret?.hdd && system_info){
			for(let i=0; i<ret.hdd.length; i++){
				let drive = ret.hdd[i];
				drive.volumes = [];
				for(let n=0; n<system_info.volumes.length; n++){
					let vol = system_info.volumes[n];
					if(vol.device_name == drive.name){
						drive.volumes.push({name:vol.name, label:vol.label})
					}
				}
			}
		}
		if(ret?.ram && system_info){
			for(let i=0; i<ret.ram.length; i++){
				ret.ram[i].total = system_info.memory.total;
			}
		}
		if(filter){
			resolve(filterData(ret, filter));
		}
		else {
			resolve(ret);
		}
	})
}

function filterData(_data, selection){
    let data = structuredClone(_data);
    for(let key in data){
        for(let i=0; i<data[key].length; i++){
            for(let skey in data[key][i]){
                for(let sensor in data[key][i][skey]){
                    if(data[key][i][skey][sensor]?.SensorId){
						let seek = ut.slugify(data[key][i][skey][sensor].name) + data[key][i][skey][sensor].SensorId;
                        if(selection.includes(seek)){
                            data[key][i][skey][sensor].selected = true;
                            data[key][i][skey].selected = true;
                            data[key][i].selected = true;
                            data[key].selected = true;
                        }
                        else {
                            delete data[key][i][skey][sensor];
                        }
                    }
                }
            }
        }
    }
    
    for(let key in data){
        if(data[key].selected){
            delete data[key].selected;
            for(let i=0; i<data[key].length; i++){
                if(data[key][i]?.selected){
                    delete data[key][i].selected;
                    for(let skey in data[key][i]){
                        if(data[key][i][skey]?.selected){
                            delete data[key][i][skey].selected;
                        }
                        else {
                            if(skey != 'volumes' && skey != 'name'){
                                delete data[key][i][skey]
                            }
                        } 
                    }
                }
                else {
                    delete data[key][i];
                }
            }
			data[key] = data[key].filter(Boolean);
        }
        else {
            delete data[key];
        }
    }
	return data;
}

async function selectChange(selection){
	g.change_timestamp = Date.now();
    const currentConfig = userConfig.get();
	currentConfig.sensor_selection = selection;
    userConfig.set(currentConfig);
	tools.sendToMain('selection_change', g.change_timestamp)
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


window.stage = {init:init};
