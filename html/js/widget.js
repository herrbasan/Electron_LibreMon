'use strict';
import ut from '../nui/nui_ut.js';
import { sysmon_poll } from '../nui/nui_sysmon_poll.js';

let emptyStateEl;
let widgetEl;

function init(){
    emptyStateEl = ut.el('.empty-state');
    widgetEl = ut.el('.hm_widget');
    
    sysmon_poll.init(widgetEl);
    window.resetWidget = reset;
    window.updateEmptyState = updateEmptyState;
    
    // Set up button click handler
    const btn = ut.el('.empty-state .open-settings-btn');
    if(btn) {
        btn.addEventListener('click', () => {
            if(window?.electron_widget?.openSettings) {
                window.electron_widget.openSettings();
            }
        });
    }
    
    // Check initial empty state after a short delay to let config load
    setTimeout(checkEmptyState, 100);
    
    return render;
}

function checkEmptyState() {
    const config = window.getWidgetConfig ? window.getWidgetConfig() : null;
    const selection = config?.sensor_selection || [];
    const isEmpty = !selection || selection.length === 0;
    
    if(emptyStateEl) {
        emptyStateEl.classList.toggle('hidden', !isEmpty);
    }
    if(widgetEl) {
        widgetEl.style.display = isEmpty ? 'none' : '';
    }
}

function updateEmptyState(config) {
    const selection = config?.sensor_selection || [];
    const isEmpty = !selection || selection.length === 0;
    
    if(emptyStateEl) {
        emptyStateEl.classList.toggle('hidden', !isEmpty);
    }
    if(widgetEl) {
        widgetEl.style.display = isEmpty ? 'none' : '';
    }
}

function reset(){
    widgetEl.innerHTML = '';
    sysmon_poll.init(widgetEl);
    checkEmptyState();
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