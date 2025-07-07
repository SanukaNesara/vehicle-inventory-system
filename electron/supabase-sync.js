let createClient;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (error) {
  console.log('Supabase module not available - running in offline mode');
  createClient = null;
}
const { getDatabase } = require('./database');

class SupabaseSync {
  constructor() {
    this.supabase = null;
    this.syncInterval = null;
    this.isSyncing = false;
    this.lastSyncTime = null;
  }

  initialize(url, anonKey) {
    if (!createClient) {
      console.log('Supabase module not available. Running in offline mode.');
      return;
    }
    
    if (!url || !anonKey) {
      console.log('Supabase credentials not provided. Running in offline mode.');
      return;
    }

    try {
      this.supabase = createClient(url, anonKey);
      console.log('Supabase client initialized');
      this.startAutoSync();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
    }
  }

  startAutoSync() {
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, 300000);

    // Initial sync
    this.syncAll();
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncAll() {
    if (!this.supabase || this.isSyncing) return;

    this.isSyncing = true;
    console.log('Starting sync...');

    try {
      await this.syncTable('parts');
      await this.syncTable('stock_movements');
      await this.syncTable('job_cards');
      await this.syncTable('job_card_parts');
      await this.syncTable('low_stock_alerts');

      this.lastSyncTime = new Date();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncTable(tableName) {
    const db = getDatabase();
    
    try {
      // Get local data
      const localData = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Get remote data
      const { data: remoteData, error: fetchError } = await this.supabase
        .from(tableName)
        .select('*');

      if (fetchError) {
        console.error(`Error fetching ${tableName}:`, fetchError);
        return;
      }

      // Simple sync strategy: 
      // 1. Upload new local records (where id doesn't exist remotely)
      // 2. Update records based on updated_at timestamp
      
      for (const localRecord of localData) {
        const remoteRecord = remoteData.find(r => r.id === localRecord.id);
        
        if (!remoteRecord) {
          // Insert new record
          const { error } = await this.supabase
            .from(tableName)
            .insert([this.prepareForSupabase(localRecord)]);
          
          if (error) {
            console.error(`Error inserting ${tableName} record:`, error);
          }
        } else if (this.shouldUpdateRemote(localRecord, remoteRecord)) {
          // Update existing record
          const { error } = await this.supabase
            .from(tableName)
            .update(this.prepareForSupabase(localRecord))
            .eq('id', localRecord.id);
          
          if (error) {
            console.error(`Error updating ${tableName} record:`, error);
          }
        }
      }

      // Download new remote records
      for (const remoteRecord of remoteData) {
        const localRecord = localData.find(l => l.id === remoteRecord.id);
        
        if (!localRecord || this.shouldUpdateLocal(localRecord, remoteRecord)) {
          await this.updateLocalRecord(tableName, remoteRecord);
        }
      }
    } catch (error) {
      console.error(`Error syncing ${tableName}:`, error);
    }
  }

  prepareForSupabase(record) {
    // Remove SQLite-specific fields and prepare for Supabase
    const prepared = { ...record };
    delete prepared.rowid;
    prepared.last_synced = new Date().toISOString();
    return prepared;
  }

  shouldUpdateRemote(localRecord, remoteRecord) {
    // Update remote if local is newer
    const localTime = new Date(localRecord.updated_at || localRecord.created_at).getTime();
    const remoteTime = new Date(remoteRecord.updated_at || remoteRecord.created_at).getTime();
    return localTime > remoteTime;
  }

  shouldUpdateLocal(localRecord, remoteRecord) {
    // Update local if remote is newer
    const localTime = new Date(localRecord.updated_at || localRecord.created_at).getTime();
    const remoteTime = new Date(remoteRecord.updated_at || remoteRecord.created_at).getTime();
    return remoteTime > localTime;
  }

  async updateLocalRecord(tableName, remoteRecord) {
    const db = getDatabase();
    
    // Build update query based on table
    let query = '';
    let params = [];
    
    switch (tableName) {
      case 'parts':
        query = `
          INSERT OR REPLACE INTO parts 
          (id, part_number, name, description, part_type, cost_price, 
           selling_price, final_selling_price, current_stock, low_stock_threshold, 
           created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
          remoteRecord.id, remoteRecord.part_number, remoteRecord.name,
          remoteRecord.description, remoteRecord.part_type, remoteRecord.cost_price,
          remoteRecord.selling_price, remoteRecord.final_selling_price,
          remoteRecord.current_stock, remoteRecord.low_stock_threshold,
          remoteRecord.created_at, remoteRecord.updated_at
        ];
        break;
      // Add cases for other tables...
    }
    
    return new Promise((resolve, reject) => {
      db.run(query, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getSyncStatus() {
    return {
      isConnected: !!this.supabase,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime
    };
  }
}

module.exports = new SupabaseSync();