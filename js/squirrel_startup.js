const path = require('path');
const spawn = require('child_process').spawn;
const app = require('electron').app;
const fs = require('fs').promises;

function squirrel_startup() {
    return new Promise(async (resolve, reject) => {
        let ret = false;
        let cmd = process.argv[1];
        if (app.isPackaged) {
            await write_log('Squirrel command: ' + (cmd || 'none'));
            let app_exe = process.execPath;
            app_exe = path.resolve(path.dirname(app_exe), '..', path.basename(app_exe));
            let app_path = app.getAppPath();

            let target = path.basename(app_exe);
            let acted = false;

            if (cmd === '--squirrel-install' || cmd === '--squirrel-updated') {
                await write_log('Creating shortcuts for: ' + target);
                await createShortcuts(target);
                await write_log('Install Done');
                ret = true;
                acted = true;
            }
            if (cmd === '--squirrel-uninstall') {
                await write_log('Removing shortcuts for: ' + target);
                await removeShortcuts(target);
                await write_log('Uninstall Done');
                ret = true;
                acted = true;
            }
            if (cmd === '--squirrel-obsoleted') {
                await write_log('Squirrel Obsoleted');
                ret = true;
                acted = true;
            }
            if (cmd === '--squirrel-firstrun') {
                await write_log('Squirrel Firstrun');
                await createShortcuts(target);
                ret = true;
                acted = true;
            }
            if(!acted){
                await write_log('Squirrel startup: no action for cmd ' + (cmd || 'none'));
            }
        }
        resolve({ret, cmd});
    });
}


async function createShortcuts(target) {
    const commands = [
        [`--createShortcut=${target}`],
        [`--createShortcut=${target}`, '--ShortcutDir=Desktop']
    ];
    for (const args of commands) {
        await write_log('Update.exe ' + args.join(' '));
        await runCommand(args);
    }
}

async function removeShortcuts(target) {
    const commands = [
        [`--removeShortcut=${target}`],
        [`--removeShortcut=${target}`, '--ShortcutDir=Desktop']
    ];
    for (const args of commands) {
        await write_log('Update.exe ' + args.join(' '));
        await runCommand(args);
    }
}


function runCommand(args) {
    return new Promise((resolve, reject) => {
        var updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
        spawn(updateExe, args, { detached: true }).on('close', resolve);
    })
}

function write_log(msg) {
    let ts = Date.now();
    let date = new Date().toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric", hour: '2-digit', minute: '2-digit' })
    msg = ts + ' | ' + date + ' | ' + msg;
    return fs.appendFile(path.resolve(path.dirname(process.execPath), '..', 'startup.log'), msg + '\n');
}

module.exports = squirrel_startup;