import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch } from 'react-icons/fi';

const Estimates = () => {
  const [estimates, setEstimates] = useState([]);
  const [filteredEstimates, setFilteredEstimates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEstimates();
  }, []);

  useEffect(() => {
    filterEstimates();
  }, [estimates, searchTerm]);

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.database.query(
        'all',
        `SELECT e.*, 
          COUNT(ep.id) as parts_count,
          SUM(ep.total_price) as total_amount
         FROM estimates e
         LEFT JOIN estimate_parts ep ON e.id = ep.estimate_id
         GROUP BY e.id
         ORDER BY e.created_at DESC`
      );
      setEstimates(result || []);
    } catch (error) {
      console.error('Error fetching estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEstimates = () => {
    if (!searchTerm) {
      setFilteredEstimates(estimates);
      return;
    }

    const filtered = estimates.filter(estimate =>
      (estimate.estimate_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (estimate.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (estimate.vehicle_no || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredEstimates(filtered);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Estimates</h1>
        <Link to="/add-estimate" className="btn-primary flex items-center gap-2">
          <FiPlus />
          New Estimate
        </Link>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by estimate number, customer name, or vehicle number..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Estimates List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading estimates...</p>
          </div>
        ) : filteredEstimates.length > 0 ? (
          filteredEstimates.map(estimate => (
            <div key={estimate.id} className="card p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Estimate #{estimate.estimate_no}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(estimate.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(estimate.total_amount || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {estimate.parts_count || 0} parts
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Customer: </span>
                  <span className="text-gray-900 dark:text-white">{estimate.customer_name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Vehicle: </span>
                  <span className="text-gray-900 dark:text-white">{estimate.vehicle_no}</span>
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Link
                  to={`/edit-estimate/${estimate.id}`}
                  className="btn-secondary"
                >
                  Edit
                </Link>
                <button
                  className="btn-primary"
                  onClick={() => window.print()}
                >
                  Print
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No estimates found.</p>
            <Link to="/add-estimate" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
              Create your first estimate
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Estimates; 