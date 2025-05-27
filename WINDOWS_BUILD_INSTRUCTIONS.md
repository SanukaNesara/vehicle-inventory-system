# Windows Build Instructions

## Building the Windows .exe file

Since you're on macOS, you have two options to build the Windows executable:

### Option 1: Build on a Windows Machine (Recommended)

1. Transfer the project to a Windows computer
2. Install Node.js and npm on Windows
3. Open Command Prompt and navigate to the project directory
4. Run the following commands:

```bash
# Install dependencies
npm install

# Rebuild native modules for Windows
npm run postinstall

# Build the React app
npm run build

# Create the Windows executable
npm run electron-pack:win
```

The .exe installer will be created in the `dist` folder.

### Option 2: Use GitHub Actions or CI/CD

Create a `.github/workflows/build.yml` file to automatically build for Windows:

```yaml
name: Build Electron App

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-windows:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build app
      run: npm run dist
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: windows-build
        path: dist/*.exe
```

### Option 3: Use a Windows Virtual Machine

1. Install VirtualBox or VMware on your Mac
2. Install Windows 10/11 in the VM
3. Follow the steps from Option 1 inside the VM

## Important Notes

- Make sure to replace the placeholder icon files (icon.ico and icon.png) with actual icon files before building
- The app uses SQLite3 which requires native compilation for each platform
- The build configuration is already set up in package.json

## Icon Requirements

- **Windows**: icon.ico (256x256 recommended, can contain multiple sizes)
- **macOS**: icon.icns (512x512 recommended)
- **PNG**: icon.png (512x512 for other uses)

You can use online converters to create these from a single PNG file.