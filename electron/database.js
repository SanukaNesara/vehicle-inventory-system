const sqlite = require('sqlite');
const { open } = require('sqlite');
const path = require('path');
const { app } = require('electron');

let db;

const initDatabase = async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'vehicle-inventory.db');
    db = await open({
      filename: dbPath,
      driver: require('sqlite3').Database
    });
    
    console.log('Connected to SQLite database');
    await createTables();
    return db;
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
};

const createTables = async () => {
  try {
    // Parts table with new fields
    await db.exec(`
      CREATE TABLE IF NOT EXISTS parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        part_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        part_type TEXT NOT NULL DEFAULT 'new',
        cost_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        final_selling_price REAL DEFAULT 0,
        current_stock INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Stock movements with prices
    await db.exec(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        part_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        cost_price REAL,
        selling_price REAL,
        final_selling_price REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (part_id) REFERENCES parts(id)
      )
    `);

    // Job Cards table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS job_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_name TEXT NOT NULL,
        description TEXT,
        customer_name TEXT NOT NULL,
        customer_vehicle_number TEXT NOT NULL,
        technician_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        total_cost REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Job Card Parts table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS job_card_parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_card_id INTEGER NOT NULL,
        part_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_card_id) REFERENCES job_cards(id),
        FOREIGN KEY (part_id) REFERENCES parts(id)
      )
    `);

    // Low stock alerts table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS low_stock_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        part_id INTEGER NOT NULL,
        current_stock INTEGER NOT NULL,
        threshold INTEGER NOT NULL,
        alert_sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (part_id) REFERENCES parts(id)
      )
    `);
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
};

const getDatabase = () => db;

module.exports = { initDatabase, getDatabase };