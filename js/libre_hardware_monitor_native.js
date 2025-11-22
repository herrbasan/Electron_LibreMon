'use strict';

/**
 * Native hardware monitor loader
 * Simple wrapper around the copied native-libremon-napi module
 */

const path = require('path');

try {
    // In development: require from js/libre_hardware_addon
    module.exports = require(path.join(__dirname, 'libre_hardware_addon'));
} catch (err) {
    // In packaged app: try app.asar.unpacked
    if (process.resourcesPath) {
        try {
            module.exports = require(path.join(process.resourcesPath, 'libre_hardware_addon'));
        } catch (err2) {
            throw new Error(
                'Failed to load libre_hardware_addon module.\n' +
                'Development: Run "npm run copy-addon" to copy the built module.\n' +
                'Production: Check packaging configuration.\n' +
                'Errors: ' + err.message + ' | ' + err2.message
            );
        }
    } else {
        throw new Error(
            'Failed to load libre_hardware_addon module.\n' +
            'Run "npm run copy-addon" to copy the built module from the submodule.\n' +
            'Error: ' + err.message
        );
    }
}
