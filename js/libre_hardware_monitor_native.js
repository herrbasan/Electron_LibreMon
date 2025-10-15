'use strict';

const path = require('path');

let nativeAddon = null;
let initialized = false;

function loadAddon() {
    if (!nativeAddon) {
        try {
            // In dev: load from js/libre_hardware_addon
            // In packaged: load from extraResource (resources/libre_hardware_addon)
            let addonPath;
            
            // Check if running from ASAR (packaged) by looking at __dirname
            const isPackaged = __dirname.includes('.asar');
            
            if (isPackaged) {
                // Packaged app - load from extraResource
                addonPath = path.join(process.resourcesPath, 'libre_hardware_addon', 'librehardwaremonitor_native.node');
            } else {
                // Dev mode - load from source
                addonPath = path.join(__dirname, 'libre_hardware_addon', 'librehardwaremonitor_native.node');
            }
            nativeAddon = require(addonPath);
        } catch (err) {
            throw new Error(
                'Failed to load native addon.\nError: ' + err.message
            );
        }
    }
    return nativeAddon;
}

async function init(config = {}) {
    const addon = loadAddon();
    
    // Set defaults from config
    const fullConfig = {
        cpu: config.cpu !== false,
        gpu: config.gpu !== false,
        memory: config.memory !== false,
        motherboard: config.motherboard !== false,
        storage: config.storage !== false,
        network: config.network !== false,
        psu: config.psu === true,
        controller: config.controller === true,
        battery: config.battery === true
    };
    
    try {
        await addon.init(fullConfig);
        initialized = true;
    } catch(err) {
        throw new Error('Failed to initialize hardware monitor: ' + err.message);
    }
}

function filterVirtualNetworkAdapters(data) {
    if (!data || !data.Children) return;
    
    for (const child of data.Children) {
        if (child.Children && Array.isArray(child.Children)) {
            child.Children = child.Children.filter(item => {
                if (!item.HardwareId || !item.HardwareId.includes('/nic/')) {
                    return true;
                }
                
                const name = item.Text || '';
                const virtualPatterns = [
                    '-QoS Packet Scheduler',
                    '-WFP ',
                    '-VirtualBox NDIS',
                    '-Hyper-V Virtual Switch',
                    '-Native WiFi Filter',
                    '-Virtual WiFi Filter',
                    'vEthernet',
                    'vSwitch',
                    '(Kerneldebugger)'
                ];
                
                const isVirtual = virtualPatterns.some(pattern => name.includes(pattern));
                return !isVirtual;
            });
            
            filterVirtualNetworkAdapters(child);
        }
    }
}

function filterIndividualDIMMs(data) {
    if (!data || !data.Children) return;
    
    for (const child of data.Children) {
        if (child.Children && Array.isArray(child.Children)) {
            child.Children = child.Children.filter(item => {
                if (!item.HardwareId || !item.HardwareId.includes('/memory/dimm/')) {
                    return true;
                }
                return false;
            });
            
            filterIndividualDIMMs(child);
        }
    }
}

async function poll(options = {}) {
    if (!initialized) {
        throw new Error('Hardware monitor not initialized. Call init() first.');
    }
    
    const addon = loadAddon();
    const data = addon.poll();
    
    if (options.filterVirtualNics) {
        filterVirtualNetworkAdapters(data);
    }
    
    if (options.filterDIMMs) {
        filterIndividualDIMMs(data);
    }
    
    return data;
}

async function shutdown() {
    if (!initialized) return;
    
    const addon = loadAddon();
    await addon.shutdown();
    initialized = false;
}

module.exports = {
    init,
    poll,
    shutdown
};
