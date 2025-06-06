import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

const AddEstimate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobNumbers, setJobNumbers] = useState([]);

  // List of available work types
  const workTypes = [
    'WHEEL ELIGMENT',
    'WHEEL ALIGH',
    'VAT 18%',
    'VACUUMIMNG/PRESSURE TEST AND RECHARGE',
    'UPHOLSTERY WORK',
    'UNDER GARAGE WASH',
    'TRANSPORT CHARGES',
    'TOWING CHARGE',
    'TOP UP',
    'TINKERING WORK',
    'SERVICE INSPECTION',
    'SCAN/ERASE AND RESET',
    'RETROFITTING',
    'RESET',
    'REPORT',
    'REPLACEMENT CHARGES',
    'REPLACMENT',
    'REPLACED',
    'REPLACE',
    'REPEAR',
    'REPAIR CHARGES',
    'REPAIR',
    'REMOVE AND REFIT',
    'REMOVE AND REFILL',
    'REMOVE',
    'REFIT',
    'REFILL',
    'RECHARGE A/C GAS',
    'RE-ASSEMBLE',
    'REALIGN',
    'RE ALIGN',
    'PAINT WORK',
    'PAINT TOUCH-UP',
    'OVERHAUL',
    'OTHERS',
    'OTHER PAINT JOB',
    'ON-LINE RESET',
    'OIL SERVICE',
    'NEED TO TOP UP',
    'NEED TO TO UP',
    'NEED TO REPLACE',
    'NEED TO REPEAR',
    'NEED TO CLEAN',
    'MIS.ITEMS',
    'MACHINE WORKS',
    'LUBRICATE',
    'LATH WORKS',
    'LABOUR WORKS',
    'LABOUR CHARGES',
    'JOB DONE',
    'INTERIOR CLEAN',
    'INSURANCE JOB',
    'INSTALLATION CHARGES',
    'INSPECTION CHARGES',
    'INCENTIVE-PARTS',
    'INCENTIVE-LABOUR',
    'FLUSH AND CLEAN',
    'FLUSH AND BLEED',
    'FLUSH A/C SYSTEM',
    'FIX',
    'ENGINE TUNUP',
    'ENGINE OVERHAUL',
    'DISMANTLE AND ASSEMBLE',
    'DISCOUNT',
    'DEGREASE ENGINE',
    'CUT AND POLISH',
    'CUT AND POLICE',
    'CUSHION WORKS',
    'CLEAN WORD',
    'CHECKUP',
    'CHECK ITEMS',
    'CHECK ENGINE LIGHT',
    'CHECK AND REPORT',
    'CHECK AND REPAIR',
    'CHECK AND ATTEND',
    'CHECK',
    'CHANGE',
    'BRAKE DOWN CHARGES',
    'BODY WASH',
    'AJEST',
    'ADJUSTMENT',
    '-'
  ];

  const [formData, setFormData] = useState({
    job_no: '',
    job_date: new Date().toISOString().split('T')[0],
    vehicle_no: '',
    make: '',
    model: '',
    chassis_no: '',
    engine_no: '',
    prepared_by: '',
    customer: '',
    ins_company: 'N/A',
    remarks: '',
    items: []
  });

  const [selectedType, setSelectedType] = useState('');
  const [price, setPrice] = useState('1.00');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    fetchJobNumbers();
  }, []);

  const fetchJobNumbers = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        `SELECT job_no, job_date, vehicle_no, make, model, 
                chassis_no, engine_no, customer_name, technician
         FROM job_cards 
         ORDER BY created_at DESC`
      );
      setJobNumbers(result || []);
    } catch (error) {
      console.error('Error fetching job numbers:', error);
    }
  };

  const handleJobSelect = (jobNo) => {
    const selectedJob = jobNumbers.find(job => job.job_no === jobNo);
    if (selectedJob) {
      setFormData(prev => ({
        ...prev,
        job_no: selectedJob.job_no,
        job_date: selectedJob.job_date || new Date().toISOString().split('T')[0],
        vehicle_no: selectedJob.vehicle_no || '',
        make: selectedJob.make || '',
        model: selectedJob.model || '',
        chassis_no: selectedJob.chassis_no || '',
        engine_no: selectedJob.engine_no || '',
        prepared_by: selectedJob.technician || '',
        customer: selectedJob.customer_name || ''
      }));
    }
  };

  const handleAddItem = () => {
    if (!selectedType) return;

    const newItem = {
      type: selectedType,
      description: selectedType,
      price: parseFloat(price) || 0,
      quantity: parseInt(quantity) || 1,
      value: (parseFloat(price) || 0) * (parseInt(quantity) || 1),
      fb: 'Y'
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset input fields
    setSelectedType('');
    setPrice('1.00');
    setQuantity('1');
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.value, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.job_no) {
      window.electronAPI.notification.show('Error', 'Please select a Job No.');
      return;
    }

    if (formData.items.length === 0) {
      window.electronAPI.notification.show('Error', 'Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      // Insert the estimate
      const result = await window.electronAPI.database.query(
        'run',
        `INSERT INTO estimates (
          job_no, job_date, vehicle_no,
          customer, ins_company, remarks, total_amount,
          discount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          formData.job_no,
          formData.job_date,
          formData.vehicle_no,
          formData.customer,
          formData.ins_company,
          formData.remarks,
          calculateTotal(),
          0 // discount
        ]
      );

      if (result && result.lastID) {
        // Insert estimate items
        for (const item of formData.items) {
          await window.electronAPI.database.query(
            'run',
            `INSERT INTO estimate_items (
              estimate_id, type, description, price,
              quantity, value, fb
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              result.lastID,
              item.type,
              item.description,
              item.price,
              item.quantity,
              item.value,
              item.fb
            ]
          );
        }

        window.electronAPI.notification.show('Success', 'Estimate created successfully');
        navigate('/estimates');
      }
    } catch (error) {
      console.error('Error creating estimate:', error);
      window.electronAPI.notification.show('Error', 'Failed to create estimate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/estimates')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Estimates</span>
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Right side details */}
            <div className="col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job No</label>
                  <select
                    value={formData.job_no}
                    onChange={(e) => handleJobSelect(e.target.value)}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                  >
                    <option value="">Select Job No</option>
                    {jobNumbers.map(job => (
                      <option key={job.job_no} value={job.job_no}>
                        {job.job_no}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="text"
                    value={formData.job_date}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prepared By</label>
                  <input
                    type="text"
                    value={formData.prepared_by}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Reg. No</label>
                  <input
                    type="text"
                    value={formData.vehicle_no}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Make & Model</label>
                  <input
                    type="text"
                    value={`${formData.make} ${formData.model}`.trim()}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Chassis No</label>
                  <input
                    type="text"
                    value={formData.chassis_no}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Engine No</label>
                  <input
                    type="text"
                    value={formData.engine_no}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Customer</label>
                  <input
                    type="text"
                    value={formData.customer}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ins Company</label>
                  <input
                    type="text"
                    value={formData.ins_company}
                    onChange={(e) => setFormData(prev => ({ ...prev, ins_company: e.target.value }))}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Left side work types */}
            <div className="space-y-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
              >
                <option value="">Select Work Type</option>
                {workTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price"
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                    className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-6">
            <table className="w-full text-white">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-center">F/B</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="px-4 py-2">{item.type}</td>
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="px-4 py-2 text-right">{item.price.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{item.value.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">{item.fb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end space-x-4 text-white">
            <div>
              <span className="font-medium">Total:</span>
              <span className="ml-4">{calculateTotal().toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium">Discount:</span>
              <input
                type="number"
                className="ml-4 bg-gray-900 border border-gray-700 rounded-md px-2 py-1 w-24"
                value="0.00"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/estimates')}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEstimate; 