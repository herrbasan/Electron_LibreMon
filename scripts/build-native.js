const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SUBMODULE_DIR = path.join(ROOT_DIR, 'LibreHardwareMonitor_NativeNodeIntegration');
const NAPI_DIR = path.join(SUBMODULE_DIR, 'NativeLibremon_NAPI');
const SUBMODULE_DIST = path.join(SUBMODULE_DIR, 'dist', 'NativeLibremon_NAPI');
const DEST_DIR = path.join(ROOT_DIR, 'js', 'libre_hardware_addon');

// Get Electron version from package.json
const packageJson = require(path.join(ROOT_DIR, 'package.json'));
const electronVersion = packageJson.devDependencies.electron.replace('^', '');

function run(command, cwd) {
    console.log(`Running: ${command} in ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit', shell: 'powershell.exe' });
}

try {
    // 1. Build in submodule (full rebuild including managed bridge)
    console.log('--- Building Native Addon in Submodule ---');
    run('npm run rebuild', NAPI_DIR);

    // 2. Rebuild native addon for Electron (different ABI than Node.js)
    console.log(`--- Rebuilding for Electron ${electronVersion} ---`);
    run(`npx node-gyp rebuild --target=${electronVersion} --arch=x64 --dist-url=https://electronjs.org/headers`, NAPI_DIR);

    // 3. Copy Artifacts
    console.log('--- Copying Artifacts ---');
    if (fs.existsSync(DEST_DIR)) {
        fs.rmSync(DEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DEST_DIR, { recursive: true });

    // Copy all files from submodule dist (managed bridge files)
    console.log(`Copying files from ${SUBMODULE_DIST} to ${DEST_DIR}`);
    
    if (fs.existsSync(SUBMODULE_DIST)) {
        const files = fs.readdirSync(SUBMODULE_DIST);
        for (const file of files) {
            const srcPath = path.join(SUBMODULE_DIST, file);
            const destPath = path.join(DEST_DIR, file);
            if (fs.statSync(srcPath).isFile()) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`  Copied: ${file}`);
            }
        }
    } else {
        throw new Error(`Submodule dist directory not found: ${SUBMODULE_DIST}`);
    }

    // Overwrite .node file with Electron-rebuilt version
    const electronNodeFile = path.join(NAPI_DIR, 'build', 'Release', 'librehardwaremonitor_native.node');
    if (fs.existsSync(electronNodeFile)) {
        const destNodeFile = path.join(DEST_DIR, 'librehardwaremonitor_native.node');
        fs.copyFileSync(electronNodeFile, destNodeFile);
        console.log('  Overwritten: librehardwaremonitor_native.node (Electron build)');
    } else {
        throw new Error(`Electron-built .node file not found: ${electronNodeFile}`);
    }

    // Copy nethost.dll from build/Release (required for CLR hosting)
    const nethostSrc = path.join(NAPI_DIR, 'build', 'Release', 'nethost.dll');
    if (fs.existsSync(nethostSrc)) {
        fs.copyFileSync(nethostSrc, path.join(DEST_DIR, 'nethost.dll'));
        console.log('  Copied: nethost.dll');
    } else {
        // Fallback: copy from .NET SDK if not in build folder
        const dotnetHost = 'C:\\Program Files\\dotnet\\packs\\Microsoft.NETCore.App.Host.win-x64';
        const versions = fs.readdirSync(dotnetHost).filter(v => v.startsWith('9.')).sort().reverse();
        if (versions.length > 0) {
            const nethostPath = path.join(dotnetHost, versions[0], 'runtimes', 'win-x64', 'native', 'nethost.dll');
            if (fs.existsSync(nethostPath)) {
                fs.copyFileSync(nethostPath, path.join(DEST_DIR, 'nethost.dll'));
                console.log(`  Copied: nethost.dll (from .NET SDK ${versions[0]})`);
            }
        }
    }

    console.log('--- Build Complete ---');

} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}
