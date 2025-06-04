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
    // Counters table for Pro No and Job No tracking
    await db.exec(`
      CREATE TABLE IF NOT EXISTS counters (
        id TEXT PRIMARY KEY,
        current_value INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Initialize counters if they don't exist
    await db.run(`
      INSERT OR IGNORE INTO counters (id, current_value) 
      VALUES ('pro_no', 0)
    `);
    await db.run(`
      INSERT OR IGNORE INTO counters (id, current_value) 
      VALUES ('job_no', 0)
    `);

    // Parts table with all fields
    await db.exec(`
      CREATE TABLE IF NOT EXISTS parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pro_no TEXT UNIQUE,
        part_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        item_name TEXT,
        description TEXT,
        part_type TEXT DEFAULT 'new',
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Job Cards table with job_no field
    await db.exec(`
      CREATE TABLE IF NOT EXISTS job_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_no TEXT UNIQUE NOT NULL,
        job_date DATE NOT NULL,
        in_time TIME NOT NULL,
        vehicle_no TEXT NOT NULL,
        vehicle_type TEXT DEFAULT 'CAR',
        make TEXT,
        model TEXT,
        color TEXT,
        engine_no TEXT,
        chassis_no TEXT,
        man_year TEXT,
        in_milage TEXT,
        insurance_company TEXT,
        claim_no TEXT,
        date_of_accident DATE,
        customer_type TEXT DEFAULT 'existing',
        customer_name TEXT NOT NULL,
        id_no TEXT,
        address TEXT,
        mob_no TEXT,
        tel_no TEXT,
        fax_no TEXT,
        email TEXT,
        vat_no TEXT,
        technician TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        total_cost REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Stock movements table
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

    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
};

const getDatabase = () => db;

module.exports = { initDatabase, getDatabase };