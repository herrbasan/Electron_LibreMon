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
      config: {},
    }
  ],
};