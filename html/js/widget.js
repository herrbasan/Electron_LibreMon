'use strict';
import ut from '../nui/nui_ut.js';
import { sysmon_poll } from '../nui/nui_sysmon_poll.js';


function init(){
    sysmon_poll.init(ut.el('.hm_widget'));
    return render;
}

async function render(data){
    let isVisible = false;
    if(window?.electron_widget?.helper){
        isVisible = await window.electron_widget.helper.window.isVisible();
    }
    if(isVisible){
        //console.log('render');
        sysmon_poll.push({type:'computer_stats', ip:'local:local', stats:JSON.stringify(data)});
    }
}

export default init;