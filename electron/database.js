const path = require('path');
const { app } = require('electron');

let db;
let usingNativeDatabase = false;

// Enhanced mock database implementation for fallback
const mockDb = {
  prepare: (query) => ({
    all: (params = []) => [],
    get: (params = []) => null,
    run: (params = []) => ({ lastInsertRowid: 1, changes: 1 })
  }),
  exec: (sql) => {
    console.log('Mock database executing:', sql.substring(0, 100) + '...');
  },
  close: () => {}
};

// Database initialization with multiple fallback strategies
const initDatabase = async () => {
  console.log('🔄 Initializing database...');
  
  try {
    // Strategy 1: Try sqlite + sqlite3 wrapper (most compatible)
    db = await tryInitSqliteWrapper();
    if (db) {
      usingNativeDatabase = true;
      console.log('✅ Successfully connected to SQLite database via sqlite wrapper');
    }
  } catch (error) {
    console.log('❌ SQLite wrapper failed:', error.message);
    
    try {
      // Strategy 2: Try better-sqlite3 (faster but less compatible)
      db = await tryInitBetterSqlite3();
      if (db) {
        usingNativeDatabase = true;
        console.log('✅ Successfully connected to SQLite database via better-sqlite3');
      }
    } catch (error2) {
      console.log('❌ Better-SQLite3 failed:', error2.message);
      
      // Strategy 3: Use mock database (always works)
      console.log('⚠️  Using mock database - data will not persist between sessions');
      db = mockDb;
      usingNativeDatabase = false;
    }
  }
  
  await createTables();
  await ensurePhotoColumn();
  
  console.log(`🎯 Database initialized successfully (${usingNativeDatabase ? 'Native' : 'Mock'} mode)`);
  return db;
};

// Try to initialize sqlite + sqlite3 wrapper
async function tryInitSqliteWrapper() {
  // Skip sqlite3 wrapper since it's not working
  throw new Error('SQLite3 wrapper disabled - using better-sqlite3 instead');
}

// Try to initialize better-sqlite3
async function tryInitBetterSqlite3() {
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(app.getPath('userData'), 'vehicle-inventory.db');
    console.log('🔗 Attempting to connect to database at:', dbPath);
    const db = new Database(dbPath);
    console.log('✅ Better-SQLite3 connection successful');
    return db;
  } catch (error) {
    console.log('❌ Better-SQLite3 connection failed:', error.message);
    
    // Try sql.js as fallback
    return await tryInitSqlJs();
  }
}

// Try to initialize sql.js (pure JavaScript SQLite)
async function tryInitSqlJs() {
  try {
    const initSqlJs = require('sql.js');
    const fs = require('fs');
    
    const SQL = await initSqlJs();
    const dbPath = path.join(app.getPath('userData'), 'vehicle-inventory.db');
    
    let db;
    if (fs.existsSync(dbPath)) {
      // Load existing database
      const filebuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(filebuffer);
      console.log('✅ Loaded existing database with sql.js');
    } else {
      // Create new database
      db = new SQL.Database();
      console.log('✅ Created new database with sql.js');
    }
    
    // Wrap sql.js database to match better-sqlite3 API
    const wrappedDb = {
      prepare: (sql) => ({
        all: (params = []) => {
          const stmt = db.prepare(sql);
          const results = [];
          stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        },
        get: (params = []) => {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const result = stmt.step() ? stmt.getAsObject() : null;
          stmt.free();
          return result;
        },
        run: (params = []) => {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          stmt.step();
          const changes = db.getRowsModified();
          const lastInsertRowid = db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0;
          stmt.free();
          return { changes, lastInsertRowid };
        }
      }),
      exec: (sql) => {
        db.exec(sql);
      },
      close: () => {
        // Save database to file
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
        db.close();
      },
      // Add save method for periodic saves
      save: () => {
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
      }
    };
    
    return wrappedDb;
  } catch (error) {
    console.log('❌ sql.js initialization failed:', error.message);
    throw error;
  }
}

// Create database tables
const createTables = async () => {
  try {
    if (usingNativeDatabase) {
      // Execute table creation SQL for native databases
      const tableCreationSQL = `
        -- Counters table for Pro No and Job No tracking
        CREATE TABLE IF NOT EXISTS counters (
          id TEXT PRIMARY KEY,
          current_value INTEGER NOT NULL DEFAULT 0
        );

        -- Initialize counters if they don't exist
        INSERT OR IGNORE INTO counters (id, current_value) VALUES ('pro_no', 0);
        INSERT OR IGNORE INTO counters (id, current_value) VALUES ('job_no', 0);
        INSERT OR IGNORE INTO counters (id, current_value) VALUES ('estimate_invoice', 0);
        INSERT OR IGNORE INTO counters (id, current_value) VALUES ('invoice_no', 0);

        -- Parts table with all fields
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
        );

        -- Job Cards table
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
          advance REAL DEFAULT 0,
          service_advisor TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          total_cost REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Stock movements table
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
        );

        -- Job Card Parts table
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
        );

        -- Low stock alerts table
        CREATE TABLE IF NOT EXISTS low_stock_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          part_id INTEGER NOT NULL,
          current_stock INTEGER NOT NULL,
          threshold INTEGER NOT NULL,
          alert_sent BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (part_id) REFERENCES parts(id)
        );

        -- Estimates table
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
        );

        -- Estimate items table
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
        );

        -- Invoices table
        CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inv_no TEXT UNIQUE,
          job_no TEXT,
          customer_name TEXT,
          vehicle_no TEXT,
          invoice_date TEXT,
          total_amount REAL DEFAULT 0,
          advance_paid REAL DEFAULT 0,
          balance_due REAL DEFAULT 0,
          created_at DATETIME DEFAULT (datetime('now','localtime')),
          updated_at DATETIME DEFAULT (datetime('now','localtime'))
        );

        -- Invoice items table
        CREATE TABLE IF NOT EXISTS invoice_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER,
          code TEXT,
          description TEXT,
          quantity INTEGER,
          unit_price REAL,
          selling_price REAL,
          discount REAL,
          amount REAL,
          FOREIGN KEY (invoice_id) REFERENCES invoices (id)
        );

        -- Stock receives table
        CREATE TABLE IF NOT EXISTS stock_receives (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          grn_no TEXT UNIQUE,
          rec_date TEXT,
          sup_ref TEXT,
          supplier_name TEXT,
          lot_name TEXT,
          remarks TEXT,
          total_value REAL DEFAULT 0,
          discount_value REAL DEFAULT 0,
          final_value REAL DEFAULT 0,
          created_at DATETIME DEFAULT (datetime('now','localtime')),
          updated_at DATETIME DEFAULT (datetime('now','localtime'))
        );

        -- Stock receive items table
        CREATE TABLE IF NOT EXISTS stock_receive_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          stock_receive_id INTEGER,
          part_id INTEGER,
          pro_no TEXT,
          item_description TEXT,
          unit_price REAL,
          rec_qty INTEGER,
          item_value REAL,
          dis_percent REAL,
          discount_value REAL,
          final_value REAL,
          FOREIGN KEY (stock_receive_id) REFERENCES stock_receives (id),
          FOREIGN KEY (part_id) REFERENCES parts (id)
        );
      `;

      // Execute SQL based on database type
      if (db.exec) {
        // better-sqlite3 style
        db.exec(tableCreationSQL);
      } else {
        // sqlite wrapper style
        await db.exec(tableCreationSQL);
      }
    }
    
    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
};

// Ensure photo column exists (for backwards compatibility)
const ensurePhotoColumn = async () => {
  try {
    if (usingNativeDatabase) {
      let tableInfo;
      
      if (db.prepare) {
        // better-sqlite3 style
        tableInfo = db.prepare("PRAGMA table_info(parts)").all();
      } else {
        // sqlite wrapper style
        tableInfo = await db.all("PRAGMA table_info(parts)");
      }
      
      const hasPhotoColumn = tableInfo.some(column => column.name === 'photo');
      
      if (!hasPhotoColumn) {
        console.log('Adding missing photo column to parts table');
        if (db.exec) {
          db.exec('ALTER TABLE parts ADD COLUMN photo TEXT');
        } else {
          await db.run('ALTER TABLE parts ADD COLUMN photo TEXT');
        }
        console.log('Photo column added successfully');
      } else {
        console.log('Photo column already exists');
      }
      
      // Also check for updated_at column
      const hasUpdatedAtColumn = tableInfo.some(column => column.name === 'updated_at');
      if (!hasUpdatedAtColumn) {
        console.log('Adding missing updated_at column to parts table');
        if (db.exec) {
          db.exec('ALTER TABLE parts ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        } else {
          await db.run('ALTER TABLE parts ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        }
        console.log('Updated_at column added successfully');
      }
    } else {
      console.log('Mock database: photo and updated_at columns assumed present');
    }
  } catch (err) {
    console.error('Error ensuring photo column:', err);
    // Don't throw - continue without photo functionality
  }
};

// Get database instance
const getDatabase = () => db;

// Check if using native database
const isUsingNativeDatabase = () => usingNativeDatabase;

module.exports = { 
  initDatabase, 
  getDatabase, 
  isUsingNativeDatabase 
};