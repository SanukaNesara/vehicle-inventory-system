const sqlite = require('sqlite');
const { open } = require('sqlite');
const path = require('path');
const { app } = require('electron');

const migrateDatabase = async () => {
  const dbPath = path.join(app.getPath('userData'), 'vehicle-inventory.db');
  const db = await open({
    filename: dbPath,
    driver: require('sqlite3').Database
  });

  try {
    // Create parts table if it doesn't exist
    await db.exec(`
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS counters (
        id TEXT PRIMARY KEY,
        current_value INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Initialize pro_no counter if it doesn't exist
    const counterExists = await db.get('SELECT 1 FROM counters WHERE id = ?', ['pro_no']);
    if (!counterExists) {
      await db.run('INSERT INTO counters (id, current_value) VALUES (?, ?)', ['pro_no', 0]);
    }

    // Add new columns to stock_movements table
    await safeAlterTable(db, 'stock_movements', 'cost_price REAL');
    await safeAlterTable(db, 'stock_movements', 'selling_price REAL');
    await safeAlterTable(db, 'stock_movements', 'final_selling_price REAL');

    // Create estimates table
    await db.run(`
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
    await db.run(`
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
    const estimateInvoiceCounter = await db.get('SELECT * FROM counters WHERE id = ?', ['estimate_invoice']);
    if (!estimateInvoiceCounter) {
      await db.run('INSERT INTO counters (id, current_value) VALUES (?, ?)', ['estimate_invoice', 0]);
    }

    console.log('Database migration completed!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await db.close();
  }
};

const safeAlterTable = async (db, table, column) => {
  try {
    await db.run(`ALTER TABLE ${table} ADD COLUMN ${column}`);
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.log(`${column} column already exists or error:`, error.message);
    }
  }
};

module.exports = { migrateDatabase };