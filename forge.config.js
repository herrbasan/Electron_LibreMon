const path = require('path');
module.exports = {
  packagerConfig: {
    asar: {
      unpack: "**/libre_hardware_addon/**"
    },
    ignore: ['_old', '_gsdata_', '.vscode', 'LibreHardwareMonitor_NativeNodeIntegration', 'scripts'],
    extraResource: ["./config.json", "sysmon_icon.ico", "./js/libre_hardware_addon", "./bin"],
    executableName: 'libremon',
    win32metadata: {
      'requested-execution-level':'requireAdministrator'
    },
    icon: path.join(__dirname, "assets","sysmon_icon.ico"),
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: "libremon",
        setupExe: 'libremon_Setup.exe',
        setupIcon: './assets/sysmon_icon.ico',
        iconUrl: 'https://raum.com/update/libremon/sysmon_icon.ico'
      }
    }
  ],
};