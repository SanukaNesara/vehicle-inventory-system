import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiPackage, 
  FiPlusSquare, 
  FiTruck, 
  FiFileText, 
  FiAlertTriangle,
  FiMoon,
  FiSun,
  FiClipboard,
  FiLayers
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = () => {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const menuItems = [
    { path: '/', icon: <FiHome className="w-5 h-5" />, label: 'Dashboard' },
    { path: '/inventory', icon: <FiPackage className="w-5 h-5" />, label: 'Inventory' },
    { path: '/add-part', icon: <FiPlusSquare className="w-5 h-5" />, label: 'Add Part' },
    { path: '/add-stock', icon: <FiLayers className="w-5 h-5" />, label: 'Add Stock' },
    { path: '/job-cards', icon: <FiClipboard className="w-5 h-5" />, label: 'Job Cards' },
    { path: '/stock-movement', icon: <FiTruck className="w-5 h-5" />, label: 'Stock History' },
    { path: '/low-stock', icon: <FiAlertTriangle className="w-5 h-5" />, label: 'Low Stock' },
    { path: '/reports', icon: <FiFileText className="w-5 h-5" />, label: 'Reports' },
  ];

  return (
    <div className="w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col animate-slide-in">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AutoParts Pro</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inventory Management</p>
      </div>
      
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all duration-200 group ${
              location.pathname === item.path
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className={`${location.pathname === item.path ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'}`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
        >
          {isDarkMode ? (
            <>
              <FiSun className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Light Mode</span>
            </>
          ) : (
            <>
              <FiMoon className="w-5 h-5 text-gray-700" />
              <span className="font-medium">Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;