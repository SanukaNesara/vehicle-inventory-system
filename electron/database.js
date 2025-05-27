const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

let db;

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(app.getPath('userData'), 'vehicle-inventory.db');
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables()
          .then(() => resolve(db))
          .catch(reject);
      }
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Parts table with new fields
      db.run(`
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
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Stock movements with prices
      db.run(`
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
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Job Cards table
      db.run(`
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
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Job Card Parts table
      db.run(`
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
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Low stock alerts table
      db.run(`
        CREATE TABLE IF NOT EXISTS low_stock_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          part_id INTEGER NOT NULL,
          current_stock INTEGER NOT NULL,
          threshold INTEGER NOT NULL,
          alert_sent BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (part_id) REFERENCES parts(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
};

const getDatabase = () => db;

module.exports = { initDatabase, getDatabase };