# GitHub Actions Setup Guide

## How to use GitHub Actions to build your app

### 1. Push your code to GitHub

First, create a new repository on GitHub and push your code:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Vehicle Inventory System"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### 2. GitHub Actions will automatically run

Once you push to GitHub:
- The workflow will trigger automatically
- It will build for Windows, macOS, and Linux
- You can watch the progress in the "Actions" tab of your repository

### 3. Download the built executables

After the build completes (usually takes 5-10 minutes):

1. Go to the "Actions" tab in your GitHub repository
2. Click on the latest workflow run
3. Scroll down to "Artifacts"
4. Download:
   - `windows-build` - Contains the .exe installer for Windows
   - `mac-build` - Contains the .dmg and .zip for macOS
   - `linux-build` - Contains .AppImage and .deb for Linux

### 4. Manual trigger

You can also manually trigger a build:
1. Go to Actions tab
2. Select "Build Electron App" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### 5. Automatic releases (optional)

The workflow is set up to create releases automatically when you push to main branch. To disable this, remove or comment out the `release` job in `.github/workflows/build.yml`.

## Important Notes

- Make sure your repository is public OR you have GitHub Actions enabled for private repos
- The first build might take longer as it needs to download dependencies
- Built files will be available as artifacts for 90 days by default
- For code signing on macOS/Windows, you'll need to add certificates as GitHub secrets (advanced setup)

## Troubleshooting

If the build fails:
1. Check the Actions tab for error logs
2. Common issues:
   - Missing dependencies in package.json
   - Icon files not found (make sure to add real icon files)
   - Native module compilation errors

## Next Steps

1. Replace placeholder icons with real ones:
   - `build/icon.ico` - Windows icon (256x256)
   - `build/icon.icns` - macOS icon (512x512)
   - `public/icon.png` - General use icon (512x512)

2. Update package.json with your information:
   - Change "author" field
   - Update "description"
   - Modify "appId" in build configuration

3. Test the built executables on each platform