import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiEdit, FiCheckCircle, FiClock, FiUser, FiTruck, FiX, FiEye, FiCalendar, FiPhone, FiMail, FiPrinter } from 'react-icons/fi';
import JobCardPrint from '../components/JobCardPrint';

const JobCards = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [jobCardParts, setJobCardParts] = useState([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printJobCard, setPrintJobCard] = useState(null);
  const [printJobCardParts, setPrintJobCardParts] = useState([]);

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
        (job.job_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.vehicle_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.technician || '').toLowerCase().includes(searchTerm.toLowerCase())
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
            'UPDATE parts SET current_stock = current_stock - ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?',
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

  const handleViewJobDetails = async (jobCard) => {
    setSelectedJobCard(jobCard);
    setShowJobDetails(true);
    
    // Fetch job card parts
    try {
      const parts = await window.electronAPI.database.query(
        'all',
        `SELECT jcp.*, p.name as part_name, p.part_number 
         FROM job_card_parts jcp
         LEFT JOIN parts p ON jcp.part_id = p.id
         WHERE jcp.job_card_id = ?
         ORDER BY jcp.created_at DESC`,
        [jobCard.id]
      );
      setJobCardParts(parts || []);
    } catch (error) {
      console.error('Error fetching job card parts:', error);
      setJobCardParts([]);
    }
  };

  const closeJobDetails = () => {
    setShowJobDetails(false);
    setSelectedJobCard(null);
    setJobCardParts([]);
  };

  const handlePrintPreview = async (jobCard) => {
    setPrintJobCard(jobCard);
    setShowPrintPreview(true);
    
    // Fetch job card parts for printing
    try {
      const parts = await window.electronAPI.database.query(
        'all',
        `SELECT jcp.*, p.name as part_name, p.part_number 
         FROM job_card_parts jcp
         LEFT JOIN parts p ON jcp.part_id = p.id
         WHERE jcp.job_card_id = ?
         ORDER BY jcp.created_at DESC`,
        [jobCard.id]
      );
      setPrintJobCardParts(parts || []);
    } catch (error) {
      console.error('Error fetching job card parts for print:', error);
      setPrintJobCardParts([]);
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const closePrintPreview = () => {
    setShowPrintPreview(false);
    setPrintJobCard(null);
    setPrintJobCardParts([]);
  };

  const calculateTotal = () => {
    return printJobCardParts.reduce((sum, part) => sum + (part.total_price || 0), 0);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'cancelled':
        return <FiX className="w-5 h-5 text-red-600 dark:text-red-400" />;
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

  const PrintPreviewModal = () => (
    <div className="print-preview-overlay">
      <div className="print-preview-container">
        <div className="print-preview-header">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Job Card Print Preview</h3>
            <p className="text-sm text-gray-600">Review your job card before printing</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              🖨️ Print
            </button>
            <button
              onClick={closePrintPreview}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              ✕ Close
            </button>
          </div>
        </div>
        
        <div className="print-preview-content">
          <JobCardPrint 
            jobData={printJobCard} 
            selectedParts={printJobCardParts} 
            calculateTotal={calculateTotal} 
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
            }
            
            .print-hidden {
              display: none !important;
            }
          }
          
          .print-preview-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .print-preview-container {
            background: white;
            border-radius: 8px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          
          .print-preview-header {
            background: #f8f9fa;
            padding: 16px 20px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 8px 8px 0 0;
          }
          
          .print-preview-content {
            padding: 20px;
            background: white;
            color: black;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
          }
        `
      }} />
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
                <button
                  onClick={() => handleViewJobDetails(job)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  title="View Details"
                >
                  <FiEye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePrintPreview(job)}
                  className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  title="Print"
                >
                  <FiPrinter className="w-4 h-4" />
                </button>
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
                      <FiX className="w-4 h-4" />
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

      {/* Job Card Details Modal */}
      {showJobDetails && selectedJobCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Job Card Details
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedJobCard.job_no} • Created {new Date(selectedJobCard.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={closeJobDetails}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Job Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedJobCard.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(selectedJobCard.status)}`}>
                          {selectedJobCard.status?.charAt(0).toUpperCase() + selectedJobCard.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedJobCard.job_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Time:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedJobCard.in_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Technician:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedJobCard.technician || 'Not assigned'}
                      </span>
                    </div>
                    {selectedJobCard.service_advisor && (
                      <div className="flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Service Advisor:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedJobCard.service_advisor}
                        </span>
                      </div>
                    )}
                    {selectedJobCard.advance > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Advance:</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          ${selectedJobCard.advance.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {selectedJobCard.insurance_company && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Insurance Company:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedJobCard.insurance_company}
                        </span>
                      </div>
                    )}
                    {selectedJobCard.claim_no && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Claim No:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedJobCard.claim_no}
                        </span>
                      </div>
                    )}
                    {selectedJobCard.date_of_accident && (
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Date of Accident:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(selectedJobCard.date_of_accident).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedJobCard.customer_name}
                      </p>
                    </div>
                    {selectedJobCard.mob_no && (
                      <div className="flex items-center gap-2">
                        <FiPhone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedJobCard.mob_no}
                        </span>
                      </div>
                    )}
                    {selectedJobCard.email && (
                      <div className="flex items-center gap-2">
                        <FiMail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedJobCard.email}
                        </span>
                      </div>
                    )}
                    {selectedJobCard.id_no && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">ID No:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedJobCard.id_no}
                        </span>
                      </div>
                    )}
                    {selectedJobCard.address && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Address:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedJobCard.address}
                        </p>
                      </div>
                    )}
                    {selectedJobCard.tel_no && (
                      <div className="flex items-center gap-2">
                        <FiPhone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tel:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedJobCard.tel_no}
                        </span>
                      </div>
                    )}
                    {selectedJobCard.fax_no && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Fax:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedJobCard.fax_no}
                        </span>
                      </div>
                    )}
                    {selectedJobCard.vat_no && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">VAT No:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedJobCard.vat_no}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Customer Type:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedJobCard.customer_type === 'new' ? 'New Customer' : 'Existing Customer'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vehicle Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FiTruck className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Vehicle No:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedJobCard.vehicle_no}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Vehicle Type:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedJobCard.vehicle_type || 'CAR'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Make:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedJobCard.make}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Model:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedJobCard.model}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Color:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedJobCard.color}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Year:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedJobCard.man_year}</p>
                      </div>
                    </div>
                    {selectedJobCard.engine_no && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Engine No:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedJobCard.engine_no}</p>
                      </div>
                    )}
                    {selectedJobCard.chassis_no && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Chassis No:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedJobCard.chassis_no}</p>
                      </div>
                    )}
                    {selectedJobCard.in_milage && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mileage:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedJobCard.in_milage} km</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parts Used */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Parts Used</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    {jobCardParts.length > 0 ? (
                      <div className="space-y-3">
                        {jobCardParts.map((part, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {part.part_name || 'Unknown Part'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {part.part_number || 'No part number'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Qty: {part.quantity}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                ${part.total_price?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900 dark:text-white">Total Parts Cost:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              ${jobCardParts.reduce((sum, part) => sum + (part.total_price || 0), 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No parts used in this job card
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && <PrintPreviewModal />}
    </div>
    </>
  );
};

export default JobCards;