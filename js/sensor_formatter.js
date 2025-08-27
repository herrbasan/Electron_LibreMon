'use strict';

/**
 * Shared sensor value formatting utilities
 * Used by both widget and settings interfaces for consistent display
 */

const sensorFormatter = {};

/**
 * Formats sensor values based on type with consistent rules
 * @param {number} value - Raw sensor value
 * @param {string} type - Sensor type/unit (e.g., '°C', 'GHz', '%', etc.)
 * @returns {string} Formatted value with unit
 */
sensorFormatter.formatSensorValue = function(value, type) {
    if (value === null || value === undefined || isNaN(value)) {
        return 'N/A';
    }

    let formattedValue;

    switch (type) {
        case '°C':
        case '°F':
            // Round temperatures to 1 decimal place
            formattedValue = Math.round(value * 10) / 10;
            break;

        case 'GHz':
        case 'MHz':
            // Round frequencies to integers
            formattedValue = Math.round(value);
            break;

        case '%':
            // Round percentages to 1 decimal place
            formattedValue = Math.round(value * 10) / 10;
            break;

        case 'RPM':
            // Round fan speeds to integers
            formattedValue = Math.round(value);
            break;

        case 'V':
            // Round voltages to 2 decimal places
            formattedValue = Math.round(value * 100) / 100;
            break;

        case 'W':
        case 'kW':
            // Round power to 1 decimal place
            formattedValue = Math.round(value * 10) / 10;
            break;

        case 'KB/s':
        case 'MB/s':
        case 'GB/s':
            // Round bandwidth to 1 decimal place
            formattedValue = Math.round(value * 10) / 10;
            break;

        case 'B':
        case 'KB':
        case 'MB':
        case 'GB':
        case 'TB':
            // Round storage sizes to integers
            formattedValue = Math.round(value);
            break;

        default:
            // For unknown types, round to 2 decimal places
            formattedValue = Math.round(value * 100) / 100;
            break;
    }

    return formattedValue + ' ' + type;
};

export { sensorFormatter };
