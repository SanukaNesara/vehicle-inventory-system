import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Show persistent error notification
    this.showPersistentError(`React Error: ${error.message}`);
  }

  showPersistentError(message) {
    // Remove any existing error
    const existingError = document.getElementById('persistent-error');
    if (existingError) {
      existingError.remove();
    }

    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.id = 'persistent-error';
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md';
    errorDiv.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <h4 class="font-bold">React Error</h4>
          <p class="text-sm mt-1">${message}</p>
          <button onclick="window.location.reload()" class="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">
            Reload Page
          </button>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200 text-xl">
          ×
        </button>
      </div>
    `;

    // Add to document
    document.body.appendChild(errorDiv);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Something went wrong</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {this.state.error && this.state.error.toString()}
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
            {this.state.errorInfo && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">Error Details</summary>
                <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;