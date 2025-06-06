import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const ViewJobCard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [jobCard, setJobCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobCard();
  }, [id]);

  const fetchJobCard = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'get',
        `SELECT * FROM job_cards WHERE job_no = ?`,
        [id]
      );

      if (!result) {
        window.electronAPI.notification.show('Error', 'Job card not found');
        navigate('/job-cards');
        return;
      }

      setJobCard(result);
    } catch (error) {
      console.error('Error fetching job card:', error);
      window.electronAPI.notification.show('Error', 'Failed to fetch job card details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!jobCard) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Job card not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/job-cards')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Job Cards</span>
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Job Card Details</h1>

        {/* Job Details Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Job Details</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-400">Job No</label>
              <p className="text-white font-medium">{jobCard.job_no}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Job Date</label>
              <p className="text-white font-medium">{jobCard.job_date}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">In Time</label>
              <p className="text-white font-medium">{jobCard.in_time}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Details Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Vehicle Details</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-400">Vehicle No</label>
              <p className="text-white font-medium">{jobCard.vehicle_no}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Type</label>
              <p className="text-white font-medium">{jobCard.type}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Make</label>
              <p className="text-white font-medium">{jobCard.make}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Model</label>
              <p className="text-white font-medium">{jobCard.model}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Color</label>
              <p className="text-white font-medium">{jobCard.color}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Engine No</label>
              <p className="text-white font-medium">{jobCard.engine_no}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Chassis No</label>
              <p className="text-white font-medium">{jobCard.chassis_no}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Manufacturing Year</label>
              <p className="text-white font-medium">{jobCard.man_year}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">In Mileage</label>
              <p className="text-white font-medium">{jobCard.in_milage}</p>
            </div>
          </div>
        </div>

        {/* Insurance Details Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Insurance Details</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-400">Insurance Company</label>
              <p className="text-white font-medium">{jobCard.insurance_company || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Claim No</label>
              <p className="text-white font-medium">{jobCard.claim_no || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Date of Accident</label>
              <p className="text-white font-medium">{jobCard.date_of_accident || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Customer Details Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Customer Details</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-400">Customer Name</label>
              <p className="text-white font-medium">{jobCard.customer_name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">ID No</label>
              <p className="text-white font-medium">{jobCard.id_no || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Mobile No</label>
              <p className="text-white font-medium">{jobCard.mob_no || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Telephone No</label>
              <p className="text-white font-medium">{jobCard.tel_no || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Fax No</label>
              <p className="text-white font-medium">{jobCard.fax_no || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white font-medium">{jobCard.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">VAT No</label>
              <p className="text-white font-medium">{jobCard.vat_no || 'N/A'}</p>
            </div>
            <div className="col-span-3">
              <label className="text-sm text-gray-400">Address</label>
              <p className="text-white font-medium whitespace-pre-wrap">{jobCard.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Additional Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-400">Technician</label>
              <p className="text-white font-medium">{jobCard.technician || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Customer Type</label>
              <p className="text-white font-medium">{jobCard.customer_type || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Remarks</h2>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-white font-medium whitespace-pre-wrap">{jobCard.remarks || 'No remarks'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewJobCard; 