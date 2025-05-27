const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

const migrateDatabase = () => {
  const dbPath = path.join(app.getPath('userData'), 'vehicle-inventory.db');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    // Add new columns to parts table if they don't exist
    db.run(`ALTER TABLE parts ADD COLUMN part_type TEXT DEFAULT 'new'`, (err) => {
      if (err && !err.message.includes('duplicate column')) console.log('part_type column already exists or error:', err.message);
    });

    db.run(`ALTER TABLE parts ADD COLUMN cost_price REAL DEFAULT 0`, (err) => {
      if (err && !err.message.includes('duplicate column')) console.log('cost_price column already exists or error:', err.message);
    });

    db.run(`ALTER TABLE parts ADD COLUMN selling_price REAL DEFAULT 0`, (err) => {
      if (err && !err.message.includes('duplicate column')) console.log('selling_price column already exists or error:', err.message);
    });

    db.run(`ALTER TABLE parts ADD COLUMN final_selling_price REAL DEFAULT 0`, (err) => {
      if (err && !err.message.includes('duplicate column')) console.log('final_selling_price column already exists or error:', err.message);
    });

    db.run(`ALTER TABLE parts ADD COLUMN low_stock_threshold INTEGER DEFAULT 10`, (err) => {
      if (err && !err.message.includes('duplicate column')) console.log('low_stock_threshold column already exists or error:', err.message);
    });

    // Update existing unit_price to final_selling_price if it exists
    db.run(`UPDATE parts SET final_selling_price = unit_price WHERE final_selling_price = 0 AND unit_price > 0`);

    // Add new columns to stock_movements table
    db.run(`ALTER TABLE stock_movements ADD COLUMN cost_price REAL`, (err) => {
      if (err && !err.message.includes('duplicate column')) console.log('stock_movements cost_price column already exists or error:', err.message);
    });

    db.run(`ALTER TABLE stock_movements ADD COLUMN selling_price REAL`, (err) => {
      if (err && !err.message.includes('duplicate column')) console.log('stock_movements selling_price column already exists or error:', err.message);
    });

    db.run(`ALTER TABLE stock_movements ADD COLUMN final_selling_price REAL`, (err) => {
      if (err && !err.message.includes('duplicate column')) console.log('stock_movements final_selling_price column already exists or error:', err.message);
    });

    console.log('Database migration completed!');
  });

  db.close();
};

module.exports = { migrateDatabase };