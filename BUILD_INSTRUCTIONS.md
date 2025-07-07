# Building AutoParts Pro Executable

## Prerequisites for Windows Build
1. Install Node.js (v16 or higher) on Windows
2. Install Python 3.x and Visual Studio Build Tools
3. Copy this project folder to a Windows machine

## Build Steps

### On Windows Command Prompt:
```cmd
# Navigate to project directory
cd path\to\vehicle-inventory-system

# Install dependencies
npm install

# Rebuild native dependencies for Windows
npm run postinstall

# Build React app
npm run build

# Create Windows executable
npm run electron-pack:win
```

### Alternative - Skip Native Dependencies:
If you continue getting SQLite3 errors, try:

```cmd
# Install dependencies without rebuilding native modules
npm install --ignore-scripts

# Copy a pre-built SQLite3 binary
npm install sqlite3@5.1.7 --build-from-source=false

# Build
npm run build
npm run electron-pack:win
```

## Output Location
The executable will be created in:
```
dist/AutoParts Pro Setup 1.0.0.exe
```

## File Structure After Build
```
dist/
├── AutoParts Pro Setup 1.0.0.exe  (Windows Installer)
├── win-unpacked/                   (Unpacked app folder)
│   ├── AutoParts Pro.exe          (Main executable)
│   ├── resources/
│   └── ...
```

## Troubleshooting
- If SQLite3 fails to build, try using Node.js v16 instead of v18
- Ensure Python and Visual Studio Build Tools are installed
- Run as Administrator if you get permission errors