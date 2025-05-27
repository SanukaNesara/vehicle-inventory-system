const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { initDatabase, getDatabase } = require('./database');
const { migrateDatabase } = require('./migrate-db');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
    // icon: path.join(__dirname, '../public/icon.png') // Removed - using default icon
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  db = await initDatabase();
  
  // Run migration to update database schema
  try {
    migrateDatabase();
  } catch (error) {
    console.error('Migration error:', error);
  }
  
  createWindow();
  
  setInterval(() => {
    checkLowStock();
  }, 300000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function checkLowStock() {
  const db = getDatabase();
  db.all(
    `SELECT * FROM parts WHERE current_stock <= low_stock_threshold`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error checking low stock:', err);
        return;
      }
      
      if (rows.length > 0) {
        const notification = new Notification({
          title: 'Low Stock Alert!',
          body: `${rows.length} item(s) are running low on stock`
          // icon: path.join(__dirname, '../public/icon.png') // Removed - using default icon
        });
        
        notification.show();
        
        notification.on('click', () => {
          mainWindow.webContents.send('navigate-to-low-stock');
        });
        
        // Log alerts
        rows.forEach(part => {
          db.run(
            `INSERT INTO low_stock_alerts (part_id, current_stock, threshold, alert_sent) 
             VALUES (?, ?, ?, 1)`,
            [part.id, part.current_stock, part.low_stock_threshold]
          );
        });
      }
    }
  );
}

ipcMain.handle('db-query', async (event, { type, query, params }) => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    switch (type) {
      case 'all':
        db.all(query, params || [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
        break;
      case 'get':
        db.get(query, params || [], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
        break;
      case 'run':
        db.run(query, params || [], function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
        break;
      default:
        reject(new Error('Invalid query type'));
    }
  });
});

ipcMain.handle('show-notification', async (event, { title, body }) => {
  const notification = new Notification({
    title,
    body
    // icon: path.join(__dirname, '../public/icon.png') // Removed - using default icon
  });
  
  notification.show();
});