module.exports = {
  packagerConfig: {
    asar:true,
    ignore:['_old','_gsdata_','.vscode','bin'],
    extraResource: ["./config.json","sysmon_icon.ico", "./bin"],
    executableName: 'libremon',
    win32metadata: {
      'requested-execution-level':'requireAdministrator'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: './sysmon_icon.ico',
        iconUrl: 'https://raw.githubusercontent.com/herrbasan/Electron_LibreMon/main/sysmon_icon.ico',
        loadingGif: undefined,
        noMsi: true,
        shortcutName: 'LibreMon System Monitor'
      }
    }
  ],
};