'use strict';

const nativeMonitor = require('./libre_hardware_monitor_native.js');
const { ipcRenderer } = require('electron');

const DEFAULT_SENSOR_GROUPS = {
	cpu: true,
	gpu: true,
	memory: true,
	motherboard: true,
	storage: true,
	network: true,
	psu: false,
	controller: false,
	fanController: false,
	battery: false
};

function resolveSensorGroups(config) {
	const rawGroups = (config && typeof config === 'object') ? (config.sensor_groups || config.sensors) : null;
	const normalized = { ...DEFAULT_SENSOR_GROUPS };

	if (!rawGroups || typeof rawGroups !== 'object') {
		return normalized;
	}

	normalized.cpu = rawGroups.cpu !== false;
	normalized.gpu = rawGroups.gpu !== false;
	
	normalized.memory = rawGroups.memory !== false;
	normalized.motherboard = rawGroups.motherboard !== false;
	normalized.storage = rawGroups.storage !== false;
	normalized.network = rawGroups.network !== false;
	normalized.psu = rawGroups.psu === true;
	normalized.battery = rawGroups.battery === true;

	const controllerEnabled = rawGroups.controller === true || rawGroups.fanController === true;
	normalized.controller = controllerEnabled;
	normalized.fanController = controllerEnabled;

	return normalized;
}

let report = console.log;
let proc;
let initialized = false;

// Initialize on first use with sensor groups from config
async function ensureInitialized() {
	if (initialized) return true;
	
	try {
		// Get sensor groups from config
		const config = await ipcRenderer.invoke('get_config');
		// console.log('Full config from IPC:', config);
		const sensorGroups = resolveSensorGroups(config);
		
		// console.log('Sensor groups for N-API init:', sensorGroups);
		
		// Initialize N-API addon with ONLY the enabled sensors
		// This prevents hardware polling for disabled groups (critical for HDD wear)
		await nativeMonitor.init(sensorGroups);
		initialized = true;
		return true;
	} catch(err) {
		console.error('Failed to initialize native monitor:', err);
		return false;
	}
}

let poll = function(selected_ids){
	return new Promise(async (resolve, reject) => {
		let data;
		try{
			// Initialize if needed
			if (!await ensureInitialized()) {
				resolve(false);
				return;
			}
			
			// Get filter options from config
			const config = await ipcRenderer.invoke('get_config');
			
			// Poll from native addon
			data = await nativeMonitor.poll({
				filterVirtualNics: config.filter_virtual_nics !== false,
				filterDIMMs: config.filter_dimms !== false
			});
            // console.log('Poll data keys:', data ? data.Children.map(c => c.Text) : 'null');
		}
		catch(err){
			console.log(err);
		}

		if(data){
			let out = {};
			data = data.Children[0].Children;
			for(let i=0; i<data.length; i++){
				let type = getType(data[i]);
				if(type == 'mainboard'){
					if(data[i].Children.length > 0){
						data[i].Children = data[i].Children[0].Children;
					}
				}
				if(!out[type]){ out[type] = []};

				// Handle duplicate names (e.g. identical GPUs)
				let existing = out[type].filter(g => g.name.replace(/ #\d+$/, '') === data[i].Text);
				let suffix = '';
				
				if(existing.length > 0){
					suffix = '_' + existing.length;
				}

				let group = getGroup(data[i].Children, type, out[type].length, suffix);
				group.name = data[i].Text;

				if(existing.length > 0){
					group.name = data[i].Text + ' #' + (existing.length + 1);
					// Rename the first one if it doesn't have a number yet
					if(existing.length === 1 && !existing[0].name.match(/ #\d+$/)){
						existing[0].name = existing[0].name + ' #1';
					}
				}

				group.id = data[i].id;
				out[type].push(group);
			}
			resolve(out);
		}
		else {
			resolve(false);
		}
	});
}

function getGroup(obj, hw_type, idx, suffix){
	let out = {};
	for(let i=0; i<obj.length; i++){
		let type = slugify(obj[i].Text);
		let sensors = getSensors(obj[i].Children, hw_type, idx, suffix);
		sensors.name = obj[i].Text;
		sensors.id = obj[i].SensorId;
		if(!out[type]) { out[type] = sensors};
	}
	return out;
}

function getSensors(obj, hw_type, idx, suffix){
	let out = {};
	for(let i=0; i<obj.length; i++){
		let type = slugify(obj[i].Text);
		let values = getValues(obj[i], hw_type, idx, suffix);
		if(!out[type]){ out[type] = values}
	}
	return out;
}


function getValues(obj, hw_type, idx, suffix){
	if(obj.Children.length == 0){ delete obj.Children; }
	if(obj.ImageURL){ delete obj.ImageURL; }
	if(obj.Text){ 
		obj.name = obj.Text;
		delete obj.Text;
	}
	
	// Ensure SensorId is present and preserved
	if(!obj.SensorId) {
		if(obj.Identifier) obj.SensorId = obj.Identifier;
		else if(obj.id) obj.SensorId = obj.id;
		else obj.SensorId = hw_type + '_' + idx + '_' + slugify(obj.Text || 'unknown');
	}

	if(suffix && obj.SensorId){
		obj.SensorId = obj.SensorId + suffix;
	}

	obj.data = {};
	if(obj.Type){ delete obj.Type; }
	if(obj.id){ delete obj.id; }

	if(obj.Value) { obj.data = parseValue(obj.Value); delete obj.Value; }
	if(obj.Max) { obj.data.max = parseValue(obj.Max).value; delete obj.Max; }
	if(obj.Min) { obj.data.min = parseValue(obj.Min).value; delete obj.Min; }
	return obj;
}

function getType(item){
	let id = item.id || item.Identifier;
	if(id && typeof id === 'string'){
		id = id.toLowerCase();
		if(id.includes('cpu')) return 'cpu';
		if(id.includes('gpu')) return 'gpu';
		if(id.includes('memory') || id.includes('ram')) return 'memory';
		if(id.includes('hdd') || id.includes('ssd') || id.includes('storage') || id.includes('nvme')) return 'storage';
		if(id.includes('nic') || id.includes('network')) return 'network';
		if(id.includes('mainboard') || id.includes('motherboard')) return 'motherboard';
	}

	let s = item.ImageURL;
	if(!s) return 'unknown';
	let type = s.split('/')[1].split('.')[0];
	if(type == 'nvidia' || type == 'ati' || type == 'intel'){
		type = 'gpu';
	}
	return slugify(type);
}

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function parseValue(item){
	let split = item.split(' ');
	let type = split[1];
	let num = split[0].replace(/,/g, '.');
	num = parseFloat(num);
	return {value:num, type:type};
}

module.exports.poll = poll;