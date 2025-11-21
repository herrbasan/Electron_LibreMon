'use strict';

const fs = require('fs');
const path = require('path');

let nativeAddon = null;
let initialized = false;

const ADDON_FILENAME = 'librehardwaremonitor_native.node';
let resolvedAddonPath = null;

function buildAddonCandidatePaths() {
    const candidates = [];
    const seen = new Set();

    const pushCandidate = candidate => {
        if (!candidate || seen.has(candidate)) {
            return;
        }
        seen.add(candidate);
        candidates.push(candidate);
    };

    if (process && process.resourcesPath) {
        pushCandidate(path.join(process.resourcesPath, 'NativeLibremon_NAPI', ADDON_FILENAME));
    }

    const repoRoot = path.resolve(__dirname, '..');
    pushCandidate(path.join(repoRoot, 'LibreHardwareMonitor_NativeNodeIntegration', 'dist', 'NativeLibremon_NAPI', ADDON_FILENAME));

    // console.log('Addon candidates:', candidates);
    return candidates;
}

function loadAddon() {
    if (!nativeAddon) {
        const candidates = buildAddonCandidatePaths();
        const errors = [];

        for (const candidate of candidates) {
            if (!fs.existsSync(candidate)) {
                errors.push(candidate + ' (missing)');
                continue;
            }

            try {
                // Add the addon directory to PATH temporarily so dependencies (like nethost.dll) can be found
                const addonDir = path.dirname(candidate);
                const oldPath = process.env.PATH;
                process.env.PATH = `${addonDir}${path.delimiter}${oldPath}`;
                
                try {
                    nativeAddon = require(candidate);
                    resolvedAddonPath = candidate;
                } finally {
                    // Restore PATH
                    process.env.PATH = oldPath;
                }
                
                if (nativeAddon) return nativeAddon;
            } catch (err) {
                errors.push(candidate + ' (' + err.message + ')');
            }
        }

        if (!nativeAddon) {
            throw new Error(
                'Failed to load native addon. Checked paths:\n' +
                errors.join('\n')
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
    
    console.log('N-API init config:', fullConfig);
    
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
