const { execSync } = require('child_process');
const path = require('path');

exports.default = async function(context) {
  console.log('Building native dependencies for Electron...');
  
  try {
    // Rebuild SQLite3 for Electron
    execSync('npx electron-rebuild -f -w sqlite3', {
      cwd: context.appDir,
      stdio: 'inherit'
    });
    
    console.log('Native dependencies rebuilt successfully');
  } catch (error) {
    console.error('Failed to rebuild native dependencies:', error);
    throw error;
  }
};