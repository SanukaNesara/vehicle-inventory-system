# Database Management Guide

## Database Location

The SQLite database file (`vehicle-inventory.db`) is stored in:

- **macOS**: `~/Library/Application Support/vehicle-inventory-system/vehicle-inventory.db`
- **Windows**: `%APPDATA%/vehicle-inventory-system/vehicle-inventory.db`
- **Linux**: `~/.config/vehicle-inventory-system/vehicle-inventory.db`

## Managing the Database

### Option 1: Use SQLite Browser (Recommended)

1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open the database file from the location above
3. You can:
   - View all tables and data
   - Run SQL queries
   - Export/import data
   - Modify records directly

### Option 2: Command Line

```bash
# macOS/Linux
sqlite3 ~/Library/Application\ Support/vehicle-inventory-system/vehicle-inventory.db

# Windows (in Command Prompt)
sqlite3 "%APPDATA%\vehicle-inventory-system\vehicle-inventory.db"
```

Common commands:
```sql
.tables                     -- Show all tables
.schema parts              -- Show table structure
SELECT * FROM parts;       -- View all parts
.exit                      -- Exit sqlite
```

### Option 3: Built-in Admin Panel (Let's add one!)

We can add an admin interface to your app for database management.

## Database Schema

### Parts Table
```sql
CREATE TABLE parts (
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
);
```

### Stock Movements Table
```sql
CREATE TABLE stock_movements (
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
```

### Job Cards Table
```sql
CREATE TABLE job_cards (
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
);
```

### Job Card Parts Table
```sql
CREATE TABLE job_card_parts (
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
```

### Low Stock Alerts Table
```sql
CREATE TABLE low_stock_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL,
  current_stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  alert_sent BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (part_id) REFERENCES parts(id)
);
```

## Backup & Restore

### Backup Database
```bash
# macOS
cp ~/Library/Application\ Support/vehicle-inventory-system/vehicle-inventory.db ~/Desktop/vehicle-inventory-backup.db

# Windows
copy "%APPDATA%\vehicle-inventory-system\vehicle-inventory.db" "%USERPROFILE%\Desktop\vehicle-inventory-backup.db"
```

### Restore Database
Simply replace the database file with your backup.

## Reset Database

To start fresh, delete the database file and restart the app. It will create a new empty database.

## Export Data

### Export to CSV (using sqlite3)
```bash
sqlite3 ~/Library/Application\ Support/vehicle-inventory-system/vehicle-inventory.db
.mode csv
.output parts.csv
SELECT * FROM parts;
.output stdout
```

## Development Database

During development, you can also access the database directly:
```bash
# Run in development mode
npm start

# The database will be in the same location
```