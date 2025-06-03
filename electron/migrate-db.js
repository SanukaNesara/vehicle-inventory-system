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