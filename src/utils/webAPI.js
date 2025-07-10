// Web API to replace Electron IPC calls
const webAPI = {
  database: {
    async query(type, query, params = []) {
      try {
        if (window.webDatabase) {
          return await window.webDatabase.query(type, query, params);
        }
        throw new Error('Web database not initialized');
      } catch (error) {
        console.error('Database query error:', error);
        // Don't show persistent error for database operations in mock mode
        throw error;
      }
    }
  },

  async dbQuery(queryConfig) {
    if (window.webDatabase) {
      return await window.webDatabase.query(queryConfig.type, queryConfig.query, queryConfig.params);
    }
    return [];
  },

  async showNotification(config) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(config.title, { body: config.body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(config.title, { body: config.body });
      }
    }
  },


  // Navigation functions for web version (no-op since web uses React Router)
  onNavigateToLowStock(callback) {
    // In web version, navigation is handled by React Router, so this is a no-op
    console.log('onNavigateToLowStock called in web version - ignoring');
  },

  onNavigate(callback) {
    // In web version, navigation is handled by React Router, so this is a no-op
    console.log('onNavigate called in web version - ignoring');
  }
};

// Function to show persistent error messages
function showPersistentError(message) {
  // Remove any existing error
  const existingError = document.getElementById('persistent-error');
  if (existingError) {
    existingError.remove();
  }

  // Create error element
  const errorDiv = document.createElement('div');
  errorDiv.id = 'persistent-error';
  errorDiv.className = 'fixed inset-0 bg-red-500 text-white p-8 z-[9999] flex items-center justify-center';
  errorDiv.innerHTML = `
    <div class="bg-red-600 p-8 rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-auto">
      <div class="flex items-start justify-between mb-4">
        <h2 class="text-2xl font-bold">Application Error</h2>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-white hover:text-gray-200 text-3xl font-bold">
          ×
        </button>
      </div>
      <div class="mb-6">
        <p class="text-lg mb-4">The application encountered an error:</p>
        <pre class="bg-red-700 p-4 rounded text-sm whitespace-pre-wrap break-words">${message}</pre>
      </div>
      <div class="flex gap-4">
        <button onclick="window.location.reload()" class="bg-white text-red-600 px-6 py-2 rounded font-bold hover:bg-gray-100">
          Reload Page
        </button>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="bg-red-700 text-white px-6 py-2 rounded font-bold hover:bg-red-800">
          Dismiss
        </button>
        <button onclick="window.open('data:text/plain;charset=utf-8,' + encodeURIComponent('${message.replace(/'/g, "\\'")}'), '_blank')" class="bg-red-700 text-white px-6 py-2 rounded font-bold hover:bg-red-800">
          Copy Error
        </button>
      </div>
    </div>
  `;

  // Add to document
  document.body.appendChild(errorDiv);
  
  // Prevent page interactions
  errorDiv.style.pointerEvents = 'all';
}

// Override console.error to show persistent errors (only for critical errors)
const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  
  // Only show persistent errors for critical issues, not warnings
  if (message.includes('Failed to') || message.includes('Cannot') || message.includes('Uncaught')) {
    showPersistentError(`Console Error: ${message}`);
  }
};

// Global error handlers for persistent error display
window.addEventListener('error', (event) => {
  showPersistentError(`JavaScript Error: ${event.error?.message || event.message}`);
});

window.addEventListener('unhandledrejection', (event) => {
  showPersistentError(`Promise Rejection: ${event.reason?.message || event.reason}`);
});

// Replace electronAPI with webAPI if not in Electron
if (!window.electronAPI) {
  window.electronAPI = webAPI;
}

export default webAPI;