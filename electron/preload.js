const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  database: {
    query: (type, query, params) => ipcRenderer.invoke('db-query', { type, query, params })
  },
  notification: {
    show: (title, body) => ipcRenderer.invoke('show-notification', { title, body })
  },
  onNavigateToLowStock: (callback) => {
    ipcRenderer.on('navigate-to-low-stock', callback);
  },
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (_, path) => callback(path));
  },
  sync: {
    getStatus: () => ipcRenderer.invoke('sync-status'),
    triggerSync: () => ipcRenderer.invoke('trigger-sync')
  }
});