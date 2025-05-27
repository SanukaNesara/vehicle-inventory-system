import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiEdit, FiCheckCircle, FiXCircle, FiClock, FiUser, FiTruck } from 'react-icons/fi';

const JobCards = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter]);

  const fetchJobs = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        `SELECT j.*, 
          COUNT(jp.id) as parts_count,
          SUM(jp.total_price) as parts_total
         FROM job_cards j
         LEFT JOIN job_card_parts jp ON j.id = jp.job_card_id
         GROUP BY j.id
         ORDER BY j.created_at DESC`
      );
      setJobs(result || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.technician_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  const handleStatusChange = async (jobId, newStatus) => {
    setLoading(true);
    try {
      if (newStatus === 'completed') {
        // Get all parts for this job
        const jobParts = await window.electronAPI.database.query(
          'all',
          'SELECT * FROM job_card_parts WHERE job_card_id = ?',
          [jobId]
        );

        // Deduct stock for each part
        for (const jobPart of jobParts) {
          await window.electronAPI.database.query(
            'run',
            'UPDATE parts SET current_stock = current_stock - ? WHERE id = ?',
            [jobPart.quantity, jobPart.part_id]
          );

          // Record stock movement
          await window.electronAPI.database.query(
            'run',
            `INSERT INTO stock_movements (
              part_id, movement_type, quantity, notes
            ) VALUES (?, ?, ?, ?)`,
            [jobPart.part_id, 'OUT', jobPart.quantity, `Used in job card #${jobId}`]
          );
        }

        // Update job status and completed date
        await window.electronAPI.database.query(
          'run',
          `UPDATE job_cards SET 
            status = ?, 
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [newStatus, jobId]
        );
      } else {
        // Just update status
        await window.electronAPI.database.query(
          'run',
          `UPDATE job_cards SET 
            status = ?,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [newStatus, jobId]
        );
      }

      window.electronAPI.notification.show('Success', `Job ${newStatus} successfully`);
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      window.electronAPI.notification.show('Error', 'Failed to update job status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'cancelled':
        return <FiXCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Cards</h1>
        <Link to="/add-job-card" className="btn-primary flex items-center gap-2">
          <FiPlus />
          New Job Card
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job name, customer, vehicle number, or technician..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select-field w-full md:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map(job => (
          <div key={job.id} className="card p-6 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(job.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.job_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Job #{job.id} • {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusBadgeClass(job.status)}`}>
                {job.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <FiUser className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Customer:</span>
                <span className="font-medium text-gray-900 dark:text-white">{job.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiTruck className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                <span className="font-medium text-gray-900 dark:text-white">{job.customer_vehicle_number}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiUser className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Technician:</span>
                <span className="font-medium text-gray-900 dark:text-white">{job.technician_name}</span>
              </div>
            </div>

            {job.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {job.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Parts: </span>
                <span className="font-medium text-gray-900 dark:text-white">{job.parts_count || 0}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-3">Total: </span>
                <span className="font-medium text-gray-900 dark:text-white">${(job.total_cost || 0).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {job.status === 'pending' && (
                  <>
                    <button
                      onClick={() => navigate(`/edit-job-card/${job.id}`)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(job.id, 'completed')}
                      disabled={loading}
                      className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                      title="Complete"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(job.id, 'cancelled')}
                      disabled={loading}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      title="Cancel"
                    >
                      <FiXCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No job cards found.</p>
          <Link to="/add-job-card" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
            Create your first job card
          </Link>
        </div>
      )}
    </div>
  );
};

export default JobCards;