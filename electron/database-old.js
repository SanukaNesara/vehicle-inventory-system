const path = require('path');
const { app } = require('electron');

let db;
let usingNativeDatabase = false;

// Enhanced mock database implementation
const mockDb = {
  data: {
    parts: [],
    job_cards: [],
    stock_movements: [],
    counters: [{ id: 'pro_no', current_value: 1 }, { id: 'job_no', current_value: 1 }],
    low_stock_alerts: [],
    estimates: [],
    estimate_items: []
  },
  
  prepare: (query) => ({
    all: (params = []) => mockDb.executeQuery('all', query, params),
    get: (params = []) => mockDb.executeQuery('get', query, params),
    run: (params = []) => mockDb.executeQuery('run', query, params)
  }),
  
  exec: (sql) => {
    // Handle multiple statements
    const statements = sql.split(';').filter(s => s.trim());
    statements.forEach(statement => {
      mockDb.executeQuery('exec', statement, []);
    });
  },
  
  executeQuery: (type, query, params = []) => {
    const queryUpper = query.toUpperCase();
    
    if (queryUpper.includes('CREATE TABLE')) {
      // Table creation - just return success
      return type === 'run' ? { lastInsertRowid: 1, changes: 1 } : null;
    }
    
    if (queryUpper.includes('ALTER TABLE')) {
      // Table alteration - just return success
      return type === 'run' ? { lastInsertRowid: 1, changes: 1 } : null;
    }
    
    if (queryUpper.includes('INSERT OR IGNORE INTO COUNTERS')) {
      // Counter initialization
      return type === 'run' ? { lastInsertRowid: 1, changes: 1 } : null;
    }
    
    return type === 'get' ? null : [];
  },
  
  close: () => {}
};

const initDatabase = async () => {
  try {
    // Try multiple SQLite implementations in order of preference
    const implementations = [
      { name: 'sqlite + sqlite3', setup: setupSqliteWrapper },
      { name: 'better-sqlite3', setup: setupBetterSqlite3 },
      { name: 'mock database', setup: setupMockDatabase }
    ];
    
    for (const impl of implementations) {
      try {
        console.log(`Attempting to initialize ${impl.name}...`);
        db = await impl.setup();
        if (db) {
          console.log(`✅ Successfully initialized ${impl.name}`);
          usingNativeDatabase = impl.name !== 'mock database';
          break;
        }
      } catch (error) {
        console.log(`❌ Failed to initialize ${impl.name}:`, error.message);
        continue;
      }
    }
    
    if (!db) {
      throw new Error('All database initialization methods failed');
    }
    
    await createTables();
    await ensurePhotoColumn();
    return db;
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
};

// Database implementation setup functions
async function setupSqliteWrapper() {
  const sqlite = require('sqlite');
  const { open } = require('sqlite');
  const dbPath = path.join(app.getPath('userData'), 'vehicle-inventory.db');
  
  return await open({
    filename: dbPath,
    driver: require('sqlite3').Database
  });
}

async function setupBetterSqlite3() {
  const Database = require('better-sqlite3');
  const dbPath = path.join(app.getPath('userData'), 'vehicle-inventory.db');
  return new Database(dbPath);
}

async function setupMockDatabase() {
  console.warn('Using mock database - data will not persist between sessions');
  return mockDb;
}

const createTables = async () => {
  try {
    if (usingNativeDatabase) {
      // Use native SQL for real databases
      await executeNativeSql();
    } else {
      // Mock database table creation
      console.log('Mock database tables initialized');
    }
    
    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
};

async function executeNativeSql() {
  const sql = `
    CREATE TABLE IF NOT EXISTS counters (
      id TEXT PRIMARY KEY,
      current_value INTEGER NOT NULL DEFAULT 0
    );
    
    INSERT OR IGNORE INTO counters (id, current_value) VALUES ('pro_no', 0);
    INSERT OR IGNORE INTO counters (id, current_value) VALUES ('job_no', 0);
    INSERT OR IGNORE INTO counters (id, current_value) VALUES ('estimate_invoice', 0);
    INSERT OR IGNORE INTO counters (id, current_value) VALUES ('invoice_no', 0);

    // Parts table with all fields
    db.exec(`
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
        photo TEXT,
        created_at DATETIME DEFAULT (datetime('now','localtime')),
        updated_at DATETIME DEFAULT (datetime('now','localtime'))
      )
    `);

    // Job Cards table with job_no field
    db.exec(`
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
    db.exec(`
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
    db.exec(`
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
    db.exec(`
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

    // Estimates table
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
        created_at DATETIME DEFAULT (datetime('now','localtime')),
        updated_at DATETIME DEFAULT (datetime('now','localtime'))
      )
    `);

    // Estimate items table
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

    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
};

const ensurePhotoColumn = () => {
  try {
    // Check if photo column exists
    const tableInfo = db.prepare("PRAGMA table_info(parts)").all();
    const hasPhotoColumn = tableInfo.some(column => column.name === 'photo');
    
    if (!hasPhotoColumn) {
      console.log('Adding missing photo column to parts table');
      db.exec('ALTER TABLE parts ADD COLUMN photo TEXT');
      console.log('Photo column added successfully');
    } else {
      console.log('Photo column already exists');
    }
    
    // Also check for updated_at column
    const hasUpdatedAtColumn = tableInfo.some(column => column.name === 'updated_at');
    if (!hasUpdatedAtColumn) {
      console.log('Adding missing updated_at column to parts table');
      db.exec('ALTER TABLE parts ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      console.log('Updated_at column added successfully');
    }
  } catch (err) {
    console.error('Error ensuring photo column:', err);
    // Don't throw - continue without photo functionality
  }
};

const getDatabase = () => db;

module.exports = { initDatabase, getDatabase };