const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { initDatabase, getDatabase } = require('./database');
const { migrateDatabase } = require('./migrate-db');
const supabaseSync = require('./supabase-sync');

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
  
  // Initialize Supabase sync if credentials are available
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    supabaseSync.initialize(supabaseUrl, supabaseKey);
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
  
  try {
    switch (type) {
      case 'all':
        return await db.all(query, params || []);
      case 'get':
        return await db.get(query, params || []);
      case 'run':
        const result = await db.run(query, params || []);
        return { lastID: result.lastID, changes: result.changes };
      default:
        throw new Error('Invalid query type');
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
});

ipcMain.handle('show-notification', async (event, { title, body }) => {
  const notification = new Notification({
    title,
    body
    // icon: path.join(__dirname, '../public/icon.png') // Removed - using default icon
  });
  
  notification.show();
});

// Supabase sync handlers
ipcMain.handle('sync-status', async () => {
  return supabaseSync.getSyncStatus();
});

ipcMain.handle('trigger-sync', async () => {
  await supabaseSync.syncAll();
  return supabaseSync.getSyncStatus();
});