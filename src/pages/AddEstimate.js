import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';

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
    invoice_no: '',
    job_no: '',
    job_date: new Date().toISOString().split('T')[0],
    vehicle_no: '',
    customer: '',
    ins_company: 'N/A',
    remarks: '',
    items: [],
    discount: 0
  });

  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('1.00');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    fetchJobNumbers();
    generateInvoiceNo();
  }, []);

  const fetchJobNumbers = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        `SELECT job_no, customer_name, vehicle_no, insurance_company 
         FROM job_cards 
         ORDER BY created_at DESC`
      );
      setJobNumbers(result || []);
    } catch (error) {
      console.error('Error fetching job numbers:', error);
    }
  };

  const generateInvoiceNo = async () => {
    // If invoice_no already exists in form, don't generate a new one
    if (formData.invoice_no) {
      window.electronAPI.notification.show('Info', 'Invoice No. already generated');
      return;
    }

    try {
      // Get the current counter value and increment it
      const result = await window.electronAPI.database.query(
        'get',
        `SELECT current_value FROM counters WHERE id = 'estimate_invoice'`
      );

      let nextValue;
      if (result && result.current_value !== undefined) {
        nextValue = result.current_value + 1;
      } else {
        nextValue = 1;
      }

      // Update the counter
      await window.electronAPI.database.query(
        'run',
        `UPDATE counters SET current_value = ? WHERE id = 'estimate_invoice'`,
        [nextValue]
      );

      // Format with leading zeros (8 digits)
      const invoiceNo = nextValue.toString().padStart(8, '0');
      setFormData(prev => ({ ...prev, invoice_no: invoiceNo }));
    } catch (error) {
      console.error('Error generating Invoice No:', error);
      window.electronAPI.notification.show('Error', 'Failed to generate Invoice No.');
    }
  };

  const handleJobSelect = (jobNo) => {
    const selectedJob = jobNumbers.find(job => job.job_no === jobNo);
    if (selectedJob) {
      setFormData(prev => ({
        ...prev,
        job_no: selectedJob.job_no,
        vehicle_no: selectedJob.vehicle_no,
        customer: selectedJob.customer_name,
        ins_company: selectedJob.insurance_company || 'N/A'
      }));
    }
  };

  const handleAddItem = () => {
    if (!selectedType || !description) return;

    const newItem = {
      type: selectedType,
      description: description,
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
    setDescription('');
    setPrice('1.00');
    setQuantity('1');
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.value, 0);
  };

  const calculateBalanceDue = () => {
    return calculateTotal() - (formData.discount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoice_no) {
      window.electronAPI.notification.show('Error', 'Please generate an Invoice No. first');
      return;
    }
    
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
          invoice_no, job_no, job_date, vehicle_no,
          customer, ins_company, remarks, total_amount,
          discount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          formData.invoice_no,
          formData.job_no,
          formData.job_date,
          formData.vehicle_no,
          formData.customer,
          formData.ins_company,
          formData.remarks,
          calculateTotal(),
          formData.discount || 0
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
      if (error.message?.includes('UNIQUE constraint failed')) {
        window.electronAPI.notification.show('Error', 'Invoice number already exists');
      } else {
        window.electronAPI.notification.show('Error', 'Failed to create estimate');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gray-900 min-h-screen">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/estimates')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Estimates</span>
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-6">New Estimate</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="flex gap-6">
            {/* Left side - Items Table */}
            <div className="flex-1">
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    {workTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  />
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price"
                    className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm w-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  />
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Qty"
                    className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm w-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <FiPlus />
                    Add
                  </button>
                </div>
              </div>

              <div className="border border-gray-600 rounded-lg mb-4 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="border-r border-gray-600 px-3 py-3 text-left font-medium text-gray-200">Type</th>
                      <th className="border-r border-gray-600 px-3 py-3 text-left font-medium text-gray-200">Description</th>
                      <th className="border-r border-gray-600 px-3 py-3 text-right font-medium text-gray-200">Price</th>
                      <th className="border-r border-gray-600 px-3 py-3 text-right font-medium text-gray-200">Qty</th>
                      <th className="border-r border-gray-600 px-3 py-3 text-right font-medium text-gray-200">Value</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-200">F/B</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t border-gray-700 hover:bg-gray-750">
                        <td className="border-r border-gray-700 px-3 py-2 text-white">{item.type}</td>
                        <td className="border-r border-gray-700 px-3 py-2 text-white">{item.description}</td>
                        <td className="border-r border-gray-700 px-3 py-2 text-right text-white">{item.price.toFixed(2)}</td>
                        <td className="border-r border-gray-700 px-3 py-2 text-right text-white">{item.quantity}</td>
                        <td className="border-r border-gray-700 px-3 py-2 text-right text-white font-medium">{item.value.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center text-white">{item.fb}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 8 - formData.items.length) }).map((_, index) => (
                      <tr key={`empty-${index}`} className="border-t border-gray-700">
                        <td className="border-r border-gray-700 px-3 py-2 h-10 text-gray-500">&nbsp;</td>
                        <td className="border-r border-gray-700 px-3 py-2 text-gray-500">&nbsp;</td>
                        <td className="border-r border-gray-700 px-3 py-2 text-gray-500">&nbsp;</td>
                        <td className="border-r border-gray-700 px-3 py-2 text-gray-500">&nbsp;</td>
                        <td className="border-r border-gray-700 px-3 py-2 text-gray-500">&nbsp;</td>
                        <td className="px-3 py-2 text-gray-500">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {loading ? 'Saving...' : 'Save Estimate'}
                </button>
              </div>
            </div>

            {/* Right side - Job Details */}
            <div className="w-80 space-y-4">
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4">Job Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      value={formData.job_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_date: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Job No</label>
                    <select
                      value={formData.job_no}
                      onChange={(e) => handleJobSelect(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle No</label>
                    <input
                      type="text"
                      value={formData.vehicle_no}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicle_no: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Enter vehicle number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Customer</label>
                    <input
                      type="text"
                      value={formData.customer}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Enter customer name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Ins Company</label>
                    <input
                      type="text"
                      value={formData.ins_company}
                      onChange={(e) => setFormData(prev => ({ ...prev, ins_company: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Insurance company"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      rows="3"
                      placeholder="Additional remarks..."
                    />
                  </div>
                </div>
              </div>

              {/* Totals section */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-300">Total</span>
                    <span className="text-white font-semibold">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="font-medium text-gray-300">Discount</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm w-24 text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-3">
                    <span className="text-gray-200">Balance Due</span>
                    <span className="text-green-400">${calculateBalanceDue().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEstimate; 