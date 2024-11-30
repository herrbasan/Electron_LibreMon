'use strict';
import ut from '../nui/nui_ut.js';
let g = { hardwareType:{}, all:[] };


function init(config){
    console.log('Init Main');
    //appStart();

    g.content = ut.el('.content .hm_main');
    g.settings = ut.el('.content .hm_main .hm_settings');
    g.config = config;
    window.pushData = pushData;
    window.cleanMain = cleanUp;
}

function cleanUp(){
    ut.killKids(g.settings);
    g.hardwareType = {};
    g.all = [];
}

function pushData(data){
    renderHardwareType(g.settings, data);
}

function renderHardwareType(target, data){
    for(let key in data){
        if(!g.hardwareType[key]){
            g.hardwareType[key] = ut.createElement('div', {class:'hm_hardware_type ' + key, inner:`<div class="hm_head">${key}</div>`});
            g.hardwareType[key].hardware = {};
            target.appendChild(g.hardwareType[key]);
        }
        for(let i=0; i<data[key].length; i++){
            renderHardware(g.hardwareType[key], key, data[key][i], i)
        }
    }
}

function renderHardware(target, type, data, idx){
    let id = type + '_' + idx;
    if(!target.hardware[id]){
        target.hardware[id] = ut.createElement('div', {class:'hm_hardware ' + type, inner:`<div class="hm_head">${data.name}</div>`})
        target.appendChild(target.hardware[id]);
    }
    for(let key in data){
        renderSensorType(target.hardware[id], key, data[key]);
    }
}

function renderSensorType(target, type, data){
    let id = type;
    if(data.name){
        if(!target.sensorType) { target.sensorType = {}; }
        if(!target.sensorType[id]){
            target.sensorType[id] = ut.createElement('div', {class:'hm_sensor_type ' + type, inner:`<div class="hm_head">${data.name}</div>`})
            target.appendChild(target.sensorType[id]);
        }
        for(let key in data){
            renderSensor(target.sensorType[id], key, data[key]);
        }
    }
}

function renderSensor(target, type, data){
    let id = type;
    if(data?.name){
        if(!target.sensor) { target.sensor = {}; }
        if(!target.sensor[id]){
            let slug = ut.slugify(data.name) + data.SensorId;
            let html = ut.htmlObject(/*html*/ `
                <div class="hm_sensor ${type}">
                    <div class="nui-checkbox">
                        <input type="checkbox" id="check_${slug}" name="checkbox" value="">
                        <label for="check_${slug}">${data.name}</label>
                    </div>
                    <div class="value">${data.data.value}</div>
                </div>
            `);
            html.num = html.el('.value');
            html.checkbox = html.el('input');
            html.checkbox.slug = slug;
            html.checkbox.addEventListener('change', selectChange)
            target.sensor[id] = html;
            if(g.config.sensor_selection.includes(html.checkbox.slug)){
                html.checkbox.checked = true;
            }
            target.appendChild(target.sensor[id]);
            g.all.push(html.checkbox);
        }
        target.sensor[id].num.innerText = data.data.value + ' ' + data.data.type;
    }
}

function selectChange(e){
    let out = [];
    for(let i=0; i<g.all.length; i++){
        if(g.all[i].checked){
            out.push(g.all[i].slug);
        }
    }
    if(window?.electron_stage?.selectChange){
        window.electron_stage.selectChange(out);
    }
    g.config.sensor_selection = out;
}

export default init;