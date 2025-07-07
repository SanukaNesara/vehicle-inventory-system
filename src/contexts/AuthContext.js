import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state - always start as logged out
  useEffect(() => {
    const initializeAuth = () => {
      // Clear any existing session data on app start
      localStorage.removeItem('autoparts_auth');
      setIsAuthenticated(true);
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (success = false) => {
    if (success) {
      setIsAuthenticated(true);
      // Don't save to localStorage - session only lasts while app is open
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    // Clear any session data
    localStorage.removeItem('autoparts_auth');
  };

  const value = {
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};