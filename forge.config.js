const path = require('path');
module.exports = {
  packagerConfig: {
    asar:true,
  ignore:['_old','_gsdata_','.vscode','bin','js/libre_hardware_addon'],
  extraResource: ["./config.json","sysmon_icon.ico", "./bin", "./LibreHardwareMonitor_NativeNodeIntegration/dist/NativeLibremon_NAPI", "./js/libre_hardware_addon"],
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