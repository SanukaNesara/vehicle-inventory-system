const createInvoicesTables = `
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inv_no TEXT UNIQUE NOT NULL,
  job_no TEXT,
  vehicle_no TEXT,
  customer_name TEXT,
  inv_date DATE,
  days INTEGER,
  quantity INTEGER DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER,
  pro_no TEXT,
  item_description TEXT,
  quantity INTEGER,
  system_price REAL,
  discount REAL DEFAULT 0,
  selling_price REAL,
  print_price REAL,
  amount REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_inv_no ON invoices(inv_no);
CREATE INDEX IF NOT EXISTS idx_invoices_job_no ON invoices(job_no);
CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_no ON invoices(vehicle_no);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);
`;

module.exports = {
  up: async (db) => {
    await db.exec(createInvoicesTables);
  },
  down: async (db) => {
    await db.exec(`
      DROP TABLE IF EXISTS invoice_items;
      DROP TABLE IF EXISTS invoices;
    `);
  }
}; 