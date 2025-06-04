import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import SyncStatus from './components/SyncStatus';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AddPart from './pages/AddPart';
import StockMovement from './pages/StockMovement';
import Reports from './pages/Reports';
import LowStock from './pages/LowStock';
import AddStock from './pages/AddStock';
import JobCards from './pages/JobCards';
import AddJobCard from './pages/AddJobCard';
import EditJobCard from './pages/EditJobCard';
import Estimates from './pages/Estimates';
import AddEstimate from './pages/AddEstimate';

function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNavigateToLowStock(() => {
        navigate('/low-stock');
      });

      window.electronAPI.onNavigate((path) => {
        navigate(path);
      });
    }
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 animate-fade-in">
          <div className="flex justify-end mb-4">
            <SyncStatus />
          </div>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/add-part" element={<AddPart />} />
            <Route path="/add-stock" element={<AddStock />} />
            <Route path="/job-cards" element={<JobCards />} />
            <Route path="/add-job-card" element={<AddJobCard />} />
            <Route path="/edit-job-card/:id" element={<EditJobCard />} />
            <Route path="/stock-movement" element={<StockMovement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/low-stock" element={<LowStock />} />
            <Route path="/estimates" element={<Estimates />} />
            <Route path="/add-estimate" element={<AddEstimate />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;