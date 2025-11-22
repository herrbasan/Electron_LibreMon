#!/usr/bin/env node
/**
 * Copy the pre-built native addon from the submodule dist folder
 * Run this after building the N-API addon with: npm run build
 */

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'LibreHardwareMonitor_NativeNodeIntegration', 'dist', 'native-libremon-napi');
const dst = path.join(__dirname, '..', 'js', 'libre_hardware_addon');

if (!fs.existsSync(src)) {
    console.error('❌ Source dist folder not found:', src);
    console.error('\nYou need to build the N-API addon first:');
    console.error('  cd LibreHardwareMonitor_NativeNodeIntegration/NativeLibremon_NAPI');
    console.error('  npm install');
    console.error('  npm run build');
    process.exit(1);
}

console.log('Copying native addon from:', src);
console.log('                       to:', dst);

// Clean destination
if (fs.existsSync(dst)) {
    console.log('Cleaning existing folder...');
    fs.rmSync(dst, { recursive: true, force: true });
}

// Copy recursively
function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const dstPath = path.join(dst, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, dstPath);
        } else {
            fs.copyFileSync(srcPath, dstPath);
        }
    }
}

copyDir(src, dst);

const files = fs.readdirSync(dst);
console.log(`\n✅ Copied ${files.length} files successfully!`);
console.log('\nThe addon is ready to use in your application.');
