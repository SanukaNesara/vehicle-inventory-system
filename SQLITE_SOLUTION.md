# SQLite3 Native Binding Fix for Windows/WSL2

## Problem
SQLite3 native bindings are not compatible between WSL2 (Linux) and Windows Electron runtime, causing:
```
Error: \\?\C:\...\node_sqlite3.node is not a valid Win32 application.
```

## Solutions (in order of preference)

### 1. Native Windows Development (Recommended)
- Install Node.js and npm natively on Windows (not WSL2)
- Run all development commands in Windows Command Prompt or PowerShell
- This ensures native module compilation targets Windows

### 2. Use Docker Container
```bash
# Use official Node.js Docker image
docker run -it --rm -v ${PWD}:/app -w /app node:18 bash
npm install
npm start
```

### 3. Switch to better-sqlite3 with Windows Build Tools
```bash
# Install Windows Build Tools
npm install --global windows-build-tools

# Install better-sqlite3
npm uninstall sqlite3 sqlite
npm install better-sqlite3
npx electron-rebuild -f -w better-sqlite3
```

### 4. Use sql.js (WebAssembly - No native compilation)
```bash
npm uninstall sqlite3 sqlite
npm install sql.js
# Update database.js to use sql.js API
```

## Current Status
- Database layer is properly configured for sqlite3
- IPC handlers are correctly implemented
- Only native binding compilation is blocking startup

## Recommended Action
**Run development on native Windows environment** to resolve the native module compilation issue.

The application is ready to run once the native binding issue is resolved.