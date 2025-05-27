import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiFilter, FiPackage, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Inventory = () => {
  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [stats, setStats] = useState({
    totalParts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [parts]);

  const fetchParts = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        'SELECT * FROM parts ORDER BY name'
      );
      setParts(result || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  const calculateStats = () => {
    const totalValue = parts.reduce((sum, part) => sum + (part.current_stock * part.final_selling_price), 0);
    const lowStock = parts.filter(part => part.current_stock > 0 && part.current_stock <= part.low_stock_threshold).length;
    const outOfStock = parts.filter(part => part.current_stock === 0).length;
    
    setStats({
      totalParts: parts.length,
      totalValue,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock
    });
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.part_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || part.part_type === typeFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'out' && part.current_stock === 0) ||
                        (stockFilter === 'low' && part.current_stock > 0 && part.current_stock <= part.low_stock_threshold) ||
                        (stockFilter === 'in' && part.current_stock > part.low_stock_threshold);
    return matchesSearch && matchesType && matchesStock;
  });

  const getStockStatus = (part) => {
    if (part.current_stock === 0) {
      return { 
        class: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', 
        text: 'Out of Stock' 
      };
    }
    if (part.current_stock <= part.low_stock_threshold) {
      return { 
        class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400', 
        text: 'Low Stock' 
      };
    }
    return { 
      class: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', 
      text: 'In Stock' 
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
        <Link to="/add-part" className="btn-primary flex items-center gap-2">
          <FiPlus />
          Add Part
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Parts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalParts}</p>
            </div>
            <FiPackage className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalValue.toFixed(2)}</p>
            </div>
            <FiDollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.lowStockCount}</p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.outOfStockCount}</p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or part number..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select-field w-full md:w-40"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="new">New Parts</option>
            <option value="used">Used Parts</option>
          </select>
          <select
            className="select-field w-full md:w-40"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Part Details</th>
                <th className="text-center py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Type</th>
                <th className="text-center py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Stock</th>
                <th className="text-right py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Cost</th>
                <th className="text-right py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Price</th>
                <th className="text-right py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Value</th>
                <th className="text-center py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => {
                const status = getStockStatus(part);
                const profit = part.final_selling_price - part.cost_price;
                const profitMargin = part.cost_price > 0 ? (profit / part.cost_price * 100) : 0;
                
                return (
                  <tr key={part.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{part.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{part.part_number}</p>
                        {part.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{part.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        part.part_type === 'new' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {part.part_type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{part.current_stock}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Min: {part.low_stock_threshold}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 dark:text-white">
                      ${part.cost_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">${part.final_selling_price.toFixed(2)}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          +{profitMargin.toFixed(1)}%
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-gray-900 dark:text-white">
                      ${(part.current_stock * part.final_selling_price).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredParts.length === 0 && (
            <div className="text-center py-12">
              <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No parts found matching your filters</p>
              <Link to="/add-part" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
                Add your first part
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;