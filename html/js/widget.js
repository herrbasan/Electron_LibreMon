'use strict';
import ut from '../nui/nui_ut.js';
import { sysmon_poll } from '../nui/nui_sysmon_poll.js';


function init(){
    sysmon_poll.init(ut.el('.hm_widget'));
    window.resetWidget = reset;
    return render;
}

function reset(){
    ut.el('.hm_widget').innerHTML = '';
    sysmon_poll.init(ut.el('.hm_widget'));
}

async function render(data){
    let isVisible = false;
    if(window?.electron_widget?.helper){
        isVisible = await window.electron_widget.helper.window.isVisible();
    }
    if(isVisible){
        sysmon_poll.push({type:'computer_stats', ip:'local:local', stats:JSON.stringify(data)});
    }
}

export default init;