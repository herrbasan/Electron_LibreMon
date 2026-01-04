const path = require('path');
const spawn = require('child_process').spawn;
const app = require('electron').app;
const fs = require('fs').promises;
const pawnio = require('./electron_helper/pawnio.js');

function squirrel_startup() {
    return new Promise(async (resolve, reject) => {
        let ret = false;
        let cmd = process.argv[1];
        if (app.isPackaged) {
            await write_log('Squirrel command: ' + (cmd || 'none') + ' | argv: ' + JSON.stringify(process.argv));
            let app_exe = process.execPath;
            app_exe = path.resolve(path.dirname(app_exe), '..', path.basename(app_exe));
            let app_path = app.getAppPath();
            let resources_path = (process.resourcesPath && typeof process.resourcesPath === 'string')
                ? process.resourcesPath
                : path.dirname(app_path);

            await write_log('Squirrel paths | execPath: ' + process.execPath);
            await write_log('Squirrel paths | app.getAppPath(): ' + app_path);
            await write_log('Squirrel paths | process.resourcesPath: ' + (process.resourcesPath || 'null'));
            await write_log('Squirrel paths | resources_path: ' + resources_path);
            try {
                const searchPaths = pawnio.getInstallerSearchPaths(resources_path);
                await write_log('PawnIO installer search paths: ' + searchPaths.join(' | '));
            } catch (e) {
                await write_log('Failed to compute PawnIO search paths: ' + e.message);
            }

            let target = path.basename(app_exe);
            let acted = false;

            if (cmd === '--squirrel-install') {
                await write_log('Creating shortcuts for: ' + target);
                await createShortcuts(target);
                // PawnIO installer is interactive on some systems; do not run it in Squirrel event context.
                // Defer to normal app startup (packaged) where retries can be rate-limited.
                await write_log('PawnIO install deferred to app startup');
                await write_log('Install Done');
                // Launch app after install completes
                await write_log('Launching app after install');
                await launchApp(target);
                ret = true;
                acted = true;
            }
            if (cmd === '--squirrel-updated') {
                await write_log('Creating shortcuts for: ' + target);
                await createShortcuts(target);
                await write_log('PawnIO install deferred to app startup');
                await write_log('Update Done');
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
            if (cmd === '--squirrel-obsolete' || cmd === '--squirrel-obsoleted') {
                await write_log('Squirrel Obsolete');
                ret = true;
                acted = true;
            }
            if (cmd === '--squirrel-firstrun') {
                await write_log('Squirrel Firstrun');
                await createShortcuts(target);
                await write_log('PawnIO install deferred to app startup');
                // Don't set ret=true - let the app continue running on first launch
                ret = false;
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

function launchApp(target) {
    return new Promise((resolve, reject) => {
        var updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
        // Use --processStart to launch the app properly via Update.exe
        spawn(updateExe, ['--processStart', target], { detached: true, stdio: 'ignore' }).unref();
        // Don't wait for the app to close, resolve immediately
        resolve();
    })
}

function write_log(msg) {
    let ts = Date.now();
    let date = new Date().toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric", hour: '2-digit', minute: '2-digit' })
    msg = ts + ' | ' + date + ' | ' + msg;
    // Try multiple log locations - during install, process.execPath may be in temp folder
    const logPaths = [
        path.resolve(path.dirname(process.execPath), '..', 'startup.log'),
        path.join(app.getPath('userData'), 'startup.log'),
        path.join(process.env.LOCALAPPDATA || '', 'libremon', 'startup.log')
    ];
    // Try first path, fall back silently if it fails
    return fs.appendFile(logPaths[0], msg + '\n').catch(() => {
        return fs.appendFile(logPaths[1], msg + '\n').catch(() => {
            return fs.appendFile(logPaths[2], msg + '\n').catch(() => {});
        });
    });
}

module.exports = squirrel_startup;