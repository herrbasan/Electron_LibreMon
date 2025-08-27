'use strict';

// Intel Arc Poller - Fast polling and data transformation to match LibreHardwareMonitor format
// Integrates seamlessly with existing data flow

const detector = require('./intel_arc_detector');

let sensor = null;
let isPolling = false;

async function initialize() {
    if (!await detector.detectIntelArc()) {
        return false;
    }

    const SensorModule = detector.getSensorModule();
    if (!SensorModule) return false;

    sensor = new SensorModule.GPUSensor();
    return sensor.initialize();
}

async function poll() {
    if (!sensor || !detector.isIntelArcAvailable()) {
        return null;
    }

    try {
        const data = sensor.getSensorData();

        if (!data.valid) {
            return null;
        }

        // Transform to LibreHardwareMonitor-compatible format with categories
        const gpuGroup = {
            name: 'Intel Arc',
            id: 'intel_arc_0'
        };

        // Group sensors into categories like LibreHardwareMonitor
        if (data.temperature?.gpu !== undefined) {
            gpuGroup.temperatures = {
                gpu_temperature: {
                    name: 'GPU Temperature',
                    SensorId: '/intel_arc/0/temperature/0',
                    data: { value: data.temperature.gpu, type: '°C' }
                },
                name: 'Temperatures'
            };
        }

        if (data.frequency?.gpuCurrent !== undefined) {
            gpuGroup.clocks = {
                gpu_frequency: {
                    name: 'GPU Frequency',
                    SensorId: '/intel_arc/0/clock/0',
                    data: { value: data.frequency.gpuCurrent, type: 'MHz' }
                },
                name: 'Clocks'
            };
        }

        if (data.utilization?.gpu !== undefined) {
            gpuGroup.load = {
                gpu_utilization: {
                    name: 'GPU Utilization',
                    SensorId: '/intel_arc/0/load/0',
                    data: { value: data.utilization.gpu, type: '%' }
                },
                name: 'Load'
            };
        }

        if (data.power?.currentConsumption !== undefined) {
            gpuGroup.powers = {
                gpu_power: {
                    name: 'GPU Power',
                    SensorId: '/intel_arc/0/power/0',
                    data: { value: data.power.currentConsumption, type: 'W' }
                },
                name: 'Powers'
            };
        }

        if (data.cooling?.fanSpeed !== undefined) {
            gpuGroup.fans = {
                gpu_fan: {
                    name: 'GPU Fan',
                    SensorId: '/intel_arc/0/fan/0',
                    data: { value: data.cooling.fanSpeed, type: 'RPM' }
                },
                name: 'Fans'
            };
        }

        if (data.memory?.usagePercent !== undefined) {
            gpuGroup.data = {
                gpu_memory_usage: {
                    name: 'VRAM Usage',
                    SensorId: '/intel_arc/0/data/0',
                    data: { value: data.memory.usagePercent, type: '%' }
                },
                name: 'Data'
            };
        }

        return {
            gpu: [gpuGroup]
        };

    } catch (error) {
        console.error('Intel Arc polling error:', error.message);
        return null;
    }
}

function startPolling(callback, interval = 1000) {
    if (isPolling || !sensor) return false;

    isPolling = true;
    const pollLoop = async () => {
        if (!isPolling) return;

        const data = await poll();
        if (data && callback) {
            callback(data);
        }

        setTimeout(pollLoop, interval);
    };

    pollLoop();
    return true;
}

function stopPolling() {
    isPolling = false;
}

function destroy() {
    stopPolling();
    if (sensor) {
        sensor.destroy();
        sensor = null;
    }
}

module.exports = {
    initialize,
    poll,
    startPolling,
    stopPolling,
    destroy
};
