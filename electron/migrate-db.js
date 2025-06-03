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
    // Add new columns to parts table if they don't exist
    await safeAlterTable(db, 'parts', 'part_type TEXT DEFAULT "new"');
    await safeAlterTable(db, 'parts', 'cost_price REAL DEFAULT 0');
    await safeAlterTable(db, 'parts', 'selling_price REAL DEFAULT 0');
    await safeAlterTable(db, 'parts', 'final_selling_price REAL DEFAULT 0');
    await safeAlterTable(db, 'parts', 'low_stock_threshold INTEGER DEFAULT 10');

    // Update existing unit_price to final_selling_price if it exists
    await db.run('UPDATE parts SET final_selling_price = unit_price WHERE final_selling_price = 0 AND unit_price > 0');

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