const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SUBMODULE_DIR = path.join(ROOT_DIR, 'LibreHardwareMonitor_NativeNodeIntegration');
const NAPI_DIR = path.join(SUBMODULE_DIR, 'NativeLibremon_NAPI');
const MANAGED_DIR = path.join(SUBMODULE_DIR, 'managed', 'LibreHardwareMonitorBridge');
const DEST_DIR = path.join(ROOT_DIR, 'js', 'libre_hardware_addon');

// Electron version
const ELECTRON_VERSION = '39.2.3';

function run(command, cwd) {
    console.log(`Running: ${command} in ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit', shell: 'powershell.exe' });
}

try {
    // 1. Build Managed Bridge
    console.log('--- Building Managed Bridge ---');
    run('dotnet publish LibreHardwareMonitorBridge.csproj -c Release -r win-x64 --self-contained', MANAGED_DIR);

    // 2. Build Native Addon
    console.log('--- Building Native Addon ---');
    // Ensure npm install is run
    run('npm install', NAPI_DIR);
    
    // Set GYP_DEFINES to disable clang to avoid MSB8020 error on systems without ClangCL
    process.env.GYP_DEFINES = 'clang=0';

    // Build with Electron headers
    // We use npx node-gyp to ensure we use a compatible version
    const nodeGypCmd = `npx node-gyp rebuild --target=${ELECTRON_VERSION} --arch=x64 --dist-url=https://electronjs.org/headers --msvs_version=2022`;
    run(nodeGypCmd, NAPI_DIR);

    // 3. Copy Artifacts
    console.log('--- Copying Artifacts ---');
    if (fs.existsSync(DEST_DIR)) {
        fs.rmSync(DEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DEST_DIR, { recursive: true });

    // Copy Native Addon
    const addonSrc = path.join(NAPI_DIR, 'build', 'Release', 'librehardwaremonitor_native.node');
    const addonDest = path.join(DEST_DIR, 'librehardwaremonitor_native.node');
    console.log(`Copying ${addonSrc} to ${addonDest}`);
    fs.copyFileSync(addonSrc, addonDest);

    // Copy Managed Files
    const publishDir = path.join(MANAGED_DIR, 'bin', 'Release', 'net9.0', 'win-x64', 'publish');
    console.log(`Copying managed files from ${publishDir} to ${DEST_DIR}`);
    
    if (fs.existsSync(publishDir)) {
        const files = fs.readdirSync(publishDir);
        for (const file of files) {
            const srcPath = path.join(publishDir, file);
            const destPath = path.join(DEST_DIR, file);
            if (fs.statSync(srcPath).isFile()) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    } else {
        throw new Error(`Publish directory not found: ${publishDir}`);
    }

    // Find and copy nethost.dll if not present
    const nethostDest = path.join(DEST_DIR, 'nethost.dll');
    if (!fs.existsSync(nethostDest)) {
        console.log('nethost.dll not found in publish dir, searching in .NET packs...');
        const baseDir = 'C:\\Program Files\\dotnet\\packs\\Microsoft.NETCore.App.Host.win-x64';
        let nethostSrc = null;
        
        if (fs.existsSync(baseDir)) {
            // Sort versions descending to get the latest
            const versions = fs.readdirSync(baseDir).sort().reverse();
            for (const version of versions) {
                const dllPath = path.join(baseDir, version, 'runtimes', 'win-x64', 'native', 'nethost.dll');
                if (fs.existsSync(dllPath)) {
                    nethostSrc = dllPath;
                    break;
                }
            }
        }
        
        if (nethostSrc) {
            console.log(`Copying nethost.dll from ${nethostSrc}`);
            fs.copyFileSync(nethostSrc, nethostDest);
        } else {
            console.warn('WARNING: nethost.dll not found! The addon may fail to load.');
        }
    }

    console.log('--- Build Complete ---');

} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}
