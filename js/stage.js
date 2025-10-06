'use strict';
const { ipcRenderer } = require( "electron" );
const path = require('path');
const helper = require('./electron_helper/helper_new.js');
const libreHardwareMonitor = require('./libre_hardware_monitor_web.js');
const intelArcPoller = require('./intel_arc_poller.js');
const si = require('systeminformation');


let g = {};

let win = helper.window;
let tools = helper.tools;
let system_info;

if(window) { window.electron_stage = {init:init, selectChange:selectChange} }

async function init(){
	console.log('App Init');
	g.main_env = await helper.global.get('main_env');
	g.app_path = await helper.global.get('app_path');
	g.base_path = await helper.global.get('base_path');
	g.isPackaged = await helper.global.get('isPackaged');

	
	let config = await helper.config('user', {
		"ingest_server": "http:\\\\192.168.0.100:4440\\computer_stats",
		"poll_rate": 1000,
		"sensor_selection": [
		]
	})

	g.config = config.data;
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
	system_info = await getSystemInfo(); 
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
	pollStart();
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
		await tools.writeJSON(path.join(g.base_path, 'temp.json'), out);
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
	sendToServer(data);
	clearTimeout(g.poll_timeout);
	g.poll_timeout = setTimeout(loop,g.config.poll_rate);
}

async function sendToServer(data){
	if(g.mute_fetch) { return; }
	g.mute_fetch = true;
	let ret = await ut.jfetch(g.config.ingest_server, {stats:JSON.stringify(data)}, {credentials: 'same-origin', method: 'POST', timeout:10000});
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

function getSystemInfo(){
	return new Promise(async (resolve, reject) => {
		let bench = Date.now();
		let info = {};
		info.system = await si.system();
		info.os = await si.osInfo();
		info.disks = await si.diskLayout();
		info.volumes = await si.blockDevices();
		info.memory = await si.mem();
		info.took = Date.now() - bench;
		for(let i=0; i<info.volumes.length; i++){
			let item = info.volumes[i];
			if(item.physical == 'Local'){
				for(let n=0; n < info.disks.length; n++){
					if(info.disks[n].device == item.device){
						item.device_name = info.disks[n].name;
					}
				}
			}
		}
		resolve(info);
	});
}

async function selectChange(selection){
	g.change_timestamp = Date.now();
	g.config.sensor_selection = selection;
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