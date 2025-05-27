# Supabase Setup Guide

## 1. Create Supabase Account

1. Go to https://supabase.com
2. Sign up for a free account
3. Create a new project
4. Save your:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx`

## 2. Create Database Tables

Go to SQL Editor in Supabase and run this script:

```sql
-- Parts table
CREATE TABLE parts (
  id SERIAL PRIMARY KEY,
  part_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  part_type TEXT NOT NULL DEFAULT 'new',
  cost_price DECIMAL DEFAULT 0,
  selling_price DECIMAL DEFAULT 0,
  final_selling_price DECIMAL DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements table
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  part_id INTEGER NOT NULL REFERENCES parts(id),
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  cost_price DECIMAL,
  selling_price DECIMAL,
  final_selling_price DECIMAL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Cards table
CREATE TABLE job_cards (
  id SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  description TEXT,
  customer_name TEXT NOT NULL,
  customer_vehicle_number TEXT NOT NULL,
  technician_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_cost DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Card Parts table
CREATE TABLE job_card_parts (
  id SERIAL PRIMARY KEY,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id),
  part_id INTEGER NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Low stock alerts table
CREATE TABLE low_stock_alerts (
  id SERIAL PRIMARY KEY,
  part_id INTEGER NOT NULL REFERENCES parts(id),
  current_stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Public read access" ON parts FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert access" ON parts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update access" ON parts FOR UPDATE TO anon USING (true);
CREATE POLICY "Public delete access" ON parts FOR DELETE TO anon USING (true);

-- Repeat for other tables
CREATE POLICY "Public read access" ON stock_movements FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert access" ON stock_movements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update access" ON stock_movements FOR UPDATE TO anon USING (true);
CREATE POLICY "Public delete access" ON stock_movements FOR DELETE TO anon USING (true);

CREATE POLICY "Public read access" ON job_cards FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert access" ON job_cards FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update access" ON job_cards FOR UPDATE TO anon USING (true);
CREATE POLICY "Public delete access" ON job_cards FOR DELETE TO anon USING (true);

CREATE POLICY "Public read access" ON job_card_parts FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert access" ON job_card_parts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update access" ON job_card_parts FOR UPDATE TO anon USING (true);
CREATE POLICY "Public delete access" ON job_card_parts FOR DELETE TO anon USING (true);

CREATE POLICY "Public read access" ON low_stock_alerts FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert access" ON low_stock_alerts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update access" ON low_stock_alerts FOR UPDATE TO anon USING (true);
CREATE POLICY "Public delete access" ON low_stock_alerts FOR DELETE TO anon USING (true);
```

## 3. Add Environment Variables

Create a `.env.local` file in your project root:

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

## 5. Add Sync Configuration

Add to your package.json under the first-level (after dependencies):

```json
"supabaseSync": {
  "enabled": true,
  "syncInterval": 300000,
  "retryAttempts": 3
}
```

## 6. Usage

The app will:
- Use local SQLite by default
- Sync to Supabase when online
- Show sync status in the UI
- Handle conflicts automatically (last write wins)

## Security Notes

1. The anon key is safe to use in client apps
2. Enable Row Level Security (RLS) for production
3. Consider adding authentication for multi-user scenarios
4. Use environment variables for keys

## Testing Sync

1. Add some data offline
2. Connect to internet
3. Check Supabase dashboard - data should appear
4. Add data from another device
5. It should sync to all devices