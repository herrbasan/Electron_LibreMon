'use strict';

// Intel Arc Detector - Fast, Robust, Slim detection for Intel Arc GPUs
// Checks hardware presence before loading the sensor module

const path = require('path');

let intelArcSensor = null;
let isAvailable = false;
let detectionAttempted = false;

async function detectIntelArc() {
    if (detectionAttempted) return isAvailable;

    detectionAttempted = true;

    try {
        // Lazy load the module only when needed (Slim)
        const sensorPath = path.join(__dirname, 'drivers.gpu.control-library', 'intel-arc-sensor');
        intelArcSensor = require(sensorPath);

        const sensor = new intelArcSensor.GPUSensor();
        isAvailable = sensor.initialize();

        if (!isAvailable) {
            console.log('Intel Arc not detected or incompatible');
            return false;
        }

        console.log('Intel Arc GPU detected and initialized');
        return true;

    } catch (error) {
        console.log('Intel Arc sensor module not available:', error.message);
        isAvailable = false;
        return false;
    }
}

function isIntelArcAvailable() {
    return isAvailable;
}

function getSensorModule() {
    return isAvailable ? intelArcSensor : null;
}

module.exports = {
    detectIntelArc,
    isIntelArcAvailable,
    getSensorModule
};
