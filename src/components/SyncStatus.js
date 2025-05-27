import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCloud, FiCloudOff } from 'react-icons/fi';

const SyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState({
    isConnected: false,
    isSyncing: false,
    lastSyncTime: null
  });

  useEffect(() => {
    // Check sync status every 10 seconds
    const checkStatus = async () => {
      if (window.electronAPI?.sync) {
        const status = await window.electronAPI.sync.getStatus();
        setSyncStatus(status);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (window.electronAPI?.sync && !syncStatus.isSyncing) {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      const newStatus = await window.electronAPI.sync.triggerSync();
      setSyncStatus(newStatus);
      
      // Show notification
      if (window.electronAPI?.notification) {
        window.electronAPI.notification.show(
          'Sync Complete',
          'Data has been synchronized with cloud database'
        );
      }
    }
  };

  const formatLastSync = (time) => {
    if (!time) return 'Never';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        {syncStatus.isConnected ? (
          <FiCloud className="text-green-600 dark:text-green-400" />
        ) : (
          <FiCloudOff className="text-gray-400" />
        )}
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {syncStatus.isConnected ? 'Cloud Connected' : 'Offline Mode'}
        </span>
      </div>
      
      {syncStatus.isConnected && (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Last sync: {formatLastSync(syncStatus.lastSyncTime)}
          </div>
          
          <button
            onClick={handleManualSync}
            disabled={syncStatus.isSyncing}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              syncStatus.isSyncing ? 'cursor-not-allowed opacity-50' : ''
            }`}
            title="Sync now"
          >
            <FiRefreshCw 
              className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${
                syncStatus.isSyncing ? 'animate-spin' : ''
              }`}
            />
          </button>
        </>
      )}
    </div>
  );
};

export default SyncStatus;