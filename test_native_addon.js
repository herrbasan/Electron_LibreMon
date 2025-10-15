const nativeMonitor = require('./js/libre_hardware_monitor_native.js');

async function test() {
    try {
        console.log('Initializing native hardware monitor...');
        
        await nativeMonitor.init({
            cpu: true,
            gpu: true,
            memory: true,
            motherboard: false,
            storage: true,
            network: true,
            psu: false,
            controller: false,
            battery: false
        });
        
        console.log('Initialized successfully!');
        console.log('Polling sensors...');
        
        const data = await nativeMonitor.poll({
            filterVirtualNics: true,
            filterDIMMs: true
        });
        
        console.log('Poll successful!');
        console.log(JSON.stringify(data, null, 2));
        
        await nativeMonitor.shutdown();
        console.log('Shutdown complete');
        
    } catch (err) {
        console.error('Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

test();
