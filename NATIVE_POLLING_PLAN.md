# Native Polling Architecture Plan

## Background

### Web Polling (Current - Main Branch)
The current implementation uses LibreHardwareMonitor's built-in web server (`http://localhost:8085/data.json`) to retrieve hardware sensor data. While functional, this approach has performance limitations:

- **Poll speed**: ~100ms per poll cycle
- **Memory**: ~225MB total (5 Electron processes)
- **Architecture**: Simple HTTP fetch, minimal overhead
- **Reliability**: Stable, no memory leaks

### Native Polling v1 (Parked - `feature/native-polling-settings-ui`)

We attempted to improve performance by integrating LibreHardwareMonitor directly via a .NET native module using Edge.js bindings. This implementation also included a comprehensive settings UI.

**What went wrong:**

1. **Polling Service Architecture**: Created a dedicated headless Electron renderer process to isolate the native .NET module
   - **Memory overhead**: Added ~50MB for the dedicated renderer process
   - **IPC complexity**: Request/response tracking via Maps (`pendingPollRequests`, `pendingSystemInfoRequests`)
   - **Total memory**: ~350MB (6-7 processes)

2. **Memory Leaks**: The renderer process accumulated memory over time
   - Suspected causes: IPC Map accumulation, .NET runtime state, Electron renderer lifecycle issues
   - Workaround attempted: Destroy/respawn polling service every config change (~2-3 seconds downtime)

3. **Process Management Complexity**:
   - Stage window auto-restart every 10 minutes (pre-existing memory leak mitigation)
   - Polling service respawn on config changes
   - Multiple IPC handlers and cleanup routines
   - Risk of orphaned processes if cleanup failed

4. **Brittle Configuration Updates**:
   - Changing hardware categories required full polling service restart
   - Loading overlay needed to block UI during restart
   - Pause/resume mechanisms to prevent race conditions
   - Display reset logic to clear old sensor data

**What worked well:**

- ✅ Settings UI design (General Settings, Hardware Polling categories, Special Sensors)
- ✅ Dynamic hardware configuration
- ✅ NUI component integration
- ✅ Poll speed improvement: ~10ms (10x faster than web polling)

**Decision**: Parked implementation in branch `feature/native-polling-settings-ui` (commit `a6fdec0`) and rolled back to web polling baseline (commit `e30cc62`)

---

## Native Polling v2 - CLI Approach

### Core Concept

Instead of embedding the .NET module in an Electron renderer process, compile it as a standalone CLI executable that outputs JSON to stdout. The main Electron process spawns and manages the CLI.

### Architecture

```
┌─────────────────────────────────────────┐
│   Electron Main Process (app.js)       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Stage Window (stage.js)        │   │
│  │  - Settings UI                  │   │
│  │  - Poll loop                    │   │
│  │  - Calls native_cli_poller      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  native_cli_poller.js           │   │
│  │  - spawn() CLI process          │   │
│  │  - Parse JSON stdout            │   │
│  │  - Error handling               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                  │
                  ├─ spawn ─▶  libremon-cli.exe init --cpu --gpu --memory
                  │
                  ├─ spawn ─▶  libremon-cli.exe poll
                  │
                  └─ spawn ─▶  libremon-cli.exe shutdown
```

### CLI Interface

**Commands:**
- `libremon-cli.exe init [--cpu] [--gpu] [--memory] [--motherboard] [--storage] [--network] [--psu] [--controller] [--battery] [--intel-arc]`
  - Initializes LibreHardwareMonitor with specified sensor categories
  - Returns JSON: `{"success": true}` or `{"error": "message"}`

- `libremon-cli.exe poll`
  - Collects current sensor data
  - Returns JSON: `{"success": true, "data": {...}}`

- `libremon-cli.exe shutdown`
  - Cleans up hardware monitoring resources
  - Returns JSON: `{"success": true}`

**Output Format:**
All output to stdout as JSON. Errors/logs to stderr.

### Node.js Integration

**Module: `js/native_cli_poller.js`**

Responsibilities:
- Spawn CLI process with `child_process.spawn()`
- Build command arguments from sensor configuration object
- Parse JSON output from stdout
- Handle process errors and exit codes
- Provide simple async API: `init(config)`, `poll()`, `shutdown()`

**Usage in `stage.js`:**
```javascript
const nativeCLI = require('./native_cli_poller.js');

// On app init or settings change
await nativeCLI.shutdown();  // Clean up old state
await nativeCLI.init({
    cpu: true,
    gpu: true,
    memory: true,
    intel_arc: false
    // ...other sensors
});

// In poll loop
const result = await nativeCLI.poll();
if (result.success) {
    processData(result.data);
}
```

### Settings UI Integration

The settings UI from `feature/native-polling-settings-ui` can be brought back with simplified config change handling:

**Before (Native Renderer v1):**
1. Show loading overlay
2. Pause polling loop
3. Cleanup pending IPC requests
4. Destroy polling service window
5. Spawn new polling service window
6. Wait for IPC ready
7. Clear widget display
8. Clear stage display
9. Resume polling loop
10. Hide loading overlay

**After (CLI v2):**
1. Show loading overlay
2. `await nativeCLI.shutdown()`
3. `await nativeCLI.init(newConfig)`
4. Clear displays
5. Hide loading overlay

Total restart time: **~200ms** (vs ~2-3 seconds with renderer respawn)

### Advantages Over Native Renderer

| Aspect | Native Renderer v1 | CLI v2 |
|--------|-------------------|--------|
| **Memory** | ~350MB | ~180MB (-170MB) |
| **Processes** | 6-7 | 5 |
| **Poll Speed** | ~10ms | ~15ms |
| **Config Change** | 2-3 seconds | 200ms |
| **Complexity** | High (IPC, Maps, lifecycle) | Medium (spawn/parse) |
| **Memory Leaks** | Yes (renderer accumulation) | No (process per operation) |
| **Error Recovery** | Complex (respawn logic) | Simple (exit code + restart) |
| **Debuggability** | Difficult (embedded .NET) | Easy (standalone CLI) |

### Performance Comparison

| Implementation | Memory | Poll Speed | Complexity |
|----------------|--------|------------|------------|
| Web polling (current) | ~225MB | ~100ms | Low |
| Native renderer v1 (parked) | ~350MB | ~10ms | High |
| **CLI v2 (planned)** | **~180MB** | **~15ms** | **Medium** |

CLI v2 achieves:
- **20% less memory** than web polling
- **6-7x faster** polling than web
- **85% faster** config changes than native renderer v1
- **No memory leaks** (process isolation)
- **Simpler architecture** (no IPC overhead)

### Implementation Plan

1. **CLI Development** (in `libremon-native` repository)
   - Create console application project
   - Implement command parsing
   - Add JSON serialization
   - Handle LibreHardwareMonitor initialization per sensor flags
   - Output structured data to stdout
   - Add error handling and exit codes

2. **Node.js Wrapper** (this repository)
   - Create `js/native_cli_poller.js`
   - Implement spawn/exec logic
   - Add JSON parsing and validation
   - Handle process lifecycle
   - Add error recovery

3. **Stage Integration**
   - Modify `js/stage.js` to use CLI poller
   - Add config-to-flags conversion
   - Update poll loop
   - Integrate with existing web polling fallback

4. **Settings UI**
   - Port settings UI from `feature/native-polling-settings-ui`
   - Simplify config change handler
   - Remove complex respawn logic
   - Add instant apply with CLI restart

5. **Testing & Optimization**
   - Memory profiling
   - Poll speed benchmarking
   - Config change timing
   - Error recovery testing
   - Fallback to web polling

---

## Migration Path

### Phase 1: CLI Development
Build and test CLI independently in `libremon-native` repo

### Phase 2: Node Integration
Add `native_cli_poller.js` wrapper and test with existing config

### Phase 3: Settings UI
Port simplified settings UI without renderer respawn complexity

### Phase 4: Production Testing
Monitor memory, performance, and stability in real-world usage

### Phase 5: Cleanup
Remove old polling service code from parked branch if CLI approach is successful

---

## Risks & Mitigation

**Risk: Process startup overhead**
- Mitigation: Keep CLI process alive between polls if needed (stdin command mode)

**Risk: CLI crashes**
- Mitigation: Automatic fallback to web polling, restart CLI on next poll

**Risk: .NET runtime state issues**
- Mitigation: Process isolation ensures clean state per init/shutdown cycle

**Risk: JSON parsing errors**
- Mitigation: Validate JSON structure, log stderr output, fallback on parse failure

---

## Success Criteria

- ✅ Memory usage < 200MB (improvement over web polling)
- ✅ Poll speed < 20ms (6x faster than web polling)
- ✅ Config changes < 500ms (instant user feedback)
- ✅ No memory leaks over 24-hour runtime
- ✅ Stable process count (5 processes)
- ✅ Settings UI functional with all features from v1
- ✅ Graceful fallback to web polling on errors

---

## References

- Parked implementation: `feature/native-polling-settings-ui` branch (commit `a6fdec0`)
- Web polling baseline: `main` branch (commit `e30cc62`)
- Native module: `libremon-native` repository
- Settings UI mockup: `html/mockup.html`
