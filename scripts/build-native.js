const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SUBMODULE_DIR = path.join(ROOT_DIR, 'LibreHardwareMonitor_NativeNodeIntegration');
const NAPI_DIR = path.join(SUBMODULE_DIR, 'NativeLibremon_NAPI');
const SUBMODULE_DIST = path.join(SUBMODULE_DIR, 'dist', 'NativeLibremon_NAPI');
const DEST_DIR = path.join(ROOT_DIR, 'js', 'libre_hardware_addon');

function run(command, cwd) {
    console.log(`Running: ${command} in ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit', shell: 'powershell.exe' });
}

try {
    // 1. Build in submodule (full rebuild including managed bridge)
    console.log('--- Building Native Addon in Submodule ---');
    run('npm run rebuild', NAPI_DIR);

    // 2. Copy Artifacts
    console.log('--- Copying Artifacts ---');
    if (fs.existsSync(DEST_DIR)) {
        fs.rmSync(DEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DEST_DIR, { recursive: true });

    // Copy all files from submodule dist
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

    console.log('--- Build Complete ---');

} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}
