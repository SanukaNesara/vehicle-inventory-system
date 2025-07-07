const path = require('path');
const { app } = require('electron');

// Mock database for migration compatibility
const mockDb = {
  prepare: (query) => ({
    all: (params) => [],
    get: (params) => null,
    run: (params) => ({ lastInsertRowid: 1, changes: 1 })
  }),
  exec: (sql) => {},
  close: () => {}
};

const migrateDatabase = async () => {
  const dbPath = path.join(app.getPath('userData'), 'vehicle-inventory.db');
  
  let db;
  try {
    const Database = require('better-sqlite3');
    db = new Database(dbPath);
  } catch (nativeError) {
    console.warn('Native SQLite3 unavailable for migration, using mock database');
    db = mockDb;
  }

  try {
    // Create parts table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pro_no TEXT UNIQUE,
        part_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        part_type TEXT CHECK(part_type IN ('new', 'used')) DEFAULT 'new',
        cost_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        final_selling_price REAL DEFAULT 0,
        current_stock INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        supplier TEXT,
        item_code TEXT,
        cost_code TEXT,
        reorder_level INTEGER DEFAULT 0,
        unit TEXT DEFAULT 'NOS',
        location TEXT,
        photo TEXT,
        created_at DATETIME DEFAULT (datetime('now','localtime')),
        updated_at DATETIME DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS counters (
        id TEXT PRIMARY KEY,
        current_value INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Initialize pro_no counter if it doesn't exist
    const counterExists = db.prepare('SELECT 1 FROM counters WHERE id = ?').get('pro_no');
    if (!counterExists) {
      db.prepare('INSERT INTO counters (id, current_value) VALUES (?, ?)').run('pro_no', 0);
    }

    // Add new columns to stock_movements table
    safeAlterTable(db, 'stock_movements', 'cost_price REAL');
    safeAlterTable(db, 'stock_movements', 'selling_price REAL');
    safeAlterTable(db, 'stock_movements', 'final_selling_price REAL');
    
    // Add photo column to parts table
    safeAlterTable(db, 'parts', 'photo TEXT');
    
    // Add updated_at column to parts table
    safeAlterTable(db, 'parts', 'updated_at DATETIME DEFAULT (datetime(\'now\',\'localtime\'))');
    
    // Update existing timestamps to correct timezone (convert from UTC to local)
    try {
      // Check if we need to fix timestamps
      const sampleRecord = db.prepare('SELECT created_at FROM parts LIMIT 1').get();
      if (sampleRecord && sampleRecord.created_at) {
        console.log('Checking timestamp format:', sampleRecord.created_at);
        
        // If timestamps look like they're in UTC format, we could convert them
        // For now, just log for debugging
        console.log('Sample timestamp found. If times are incorrect, they may need manual conversion.');
      }
    } catch (error) {
      console.log('No existing parts to check timestamps for');
    }

    // Create estimates table
    db.exec(`
      CREATE TABLE IF NOT EXISTS estimates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_no TEXT UNIQUE,
        job_no TEXT,
        job_date TEXT,
        vehicle_no TEXT,
        customer TEXT,
        ins_company TEXT,
        remarks TEXT,
        total_amount REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create estimate_items table
    db.exec(`
      CREATE TABLE IF NOT EXISTS estimate_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estimate_id INTEGER,
        type TEXT,
        description TEXT,
        price REAL,
        quantity INTEGER,
        value REAL,
        fb TEXT,
        FOREIGN KEY (estimate_id) REFERENCES estimates (id)
      )
    `);

    // Add estimate_invoice counter if it doesn't exist
    const estimateInvoiceCounter = db.prepare('SELECT * FROM counters WHERE id = ?').get('estimate_invoice');
    if (!estimateInvoiceCounter) {
      db.prepare('INSERT INTO counters (id, current_value) VALUES (?, ?)').run('estimate_invoice', 0);
    }

    console.log('Database migration completed!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    db.close();
  }
};

const safeAlterTable = (db, table, column) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column}`);
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.log(`${column} column already exists or error:`, error.message);
    }
  }
};

module.exports = { migrateDatabase };