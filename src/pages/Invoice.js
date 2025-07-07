import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiPrinter, FiPlus, FiTrash2, FiSearch, FiX, FiEye } from 'react-icons/fi';

const Invoice = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPartSelector, setShowPartSelector] = useState(false);
  const [jobNumbers, setJobNumbers] = useState([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const [formData, setFormData] = useState({
    // Invoice header
    inv_no: '',
    customer_name: '',
    date: new Date().toISOString().split('T')[0],
    job_no: '',
    vehicle_no: '',
    
    // Invoice items
    items: [],
    
    // Customer totals
    customer_total_outstanding: 0,
    advance_paid: 0,
    balance_due: 0
  });

  const [selectedParts, setSelectedParts] = useState([]);

  useEffect(() => {
    fetchParts();
    fetchJobNumbers();
    generateTempInvoiceNo();
  }, []);

  const generateTempInvoiceNo = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'get',
        `SELECT current_value FROM counters WHERE id = 'invoice_no'`
      );

      let nextValue;
      if (result && result.current_value !== undefined) {
        nextValue = result.current_value + 1;
      } else {
        nextValue = 1;
        // Initialize counter if it doesn't exist
        await window.electronAPI.database.query(
          'run',
          `INSERT OR IGNORE INTO counters (id, current_value) VALUES ('invoice_no', 0)`
        );
      }

      // Show preview without updating the counter
      const invoiceNo = `INV${nextValue.toString().padStart(6, '0')}`;
      setFormData(prev => ({ ...prev, inv_no: invoiceNo }));
    } catch (error) {
      console.error('Error generating temp Invoice No:', error);
    }
  };

  const generateActualInvoiceNo = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'get',
        `SELECT current_value FROM counters WHERE id = 'invoice_no'`
      );

      let nextValue;
      if (result && result.current_value !== undefined) {
        nextValue = result.current_value + 1;
      } else {
        nextValue = 1;
      }

      // Actually update the counter
      await window.electronAPI.database.query(
        'run',
        `UPDATE counters SET current_value = ? WHERE id = 'invoice_no'`,
        [nextValue]
      );

      const invoiceNo = `INV${nextValue.toString().padStart(6, '0')}`;
      return invoiceNo;
    } catch (error) {
      console.error('Error generating actual Invoice No:', error);
      return null;
    }
  };

  const fetchParts = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        'SELECT * FROM parts WHERE current_stock > 0 ORDER BY name'
      );
      setParts(result || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  const fetchJobNumbers = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        `SELECT job_no, customer_name, vehicle_no, advance 
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
        vehicle_no: selectedJob.vehicle_no,
        customer_name: selectedJob.customer_name,
        advance_paid: selectedJob.advance || 0
      }));
    }
  };

  const handleAddPart = (part) => {
    const existingIndex = selectedParts.findIndex(p => p.id === part.id);
    if (existingIndex >= 0) {
      const updated = [...selectedParts];
      updated[existingIndex].quantity++;
      updated[existingIndex].amount = (updated[existingIndex].selling_price - updated[existingIndex].discount) * updated[existingIndex].quantity;
      setSelectedParts(updated);
    } else {
      setSelectedParts([...selectedParts, {
        ...part,
        code: part.pro_no || part.part_number,
        description: part.name,
        quantity: 1,
        unit_price: part.final_selling_price || part.selling_price || 0,
        discount: 0,
        selling_price: part.final_selling_price || part.selling_price || 0,
        amount: part.final_selling_price || part.selling_price || 0
      }]);
    }
    setShowPartSelector(false);
    setSearchTerm('');
  };

  const handleQuantityChange = (index, quantity) => {
    const updated = [...selectedParts];
    if (quantity <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = quantity;
      updated[index].selling_price = updated[index].unit_price * quantity; // Update selling price
      updated[index].amount = updated[index].selling_price - updated[index].discount;
    }
    setSelectedParts(updated);
  };

  const handlePriceChange = (index, field, value) => {
    const updated = [...selectedParts];
    updated[index][field] = parseFloat(value) || 0;
    
    // Amount is always selling price - discount
    updated[index].amount = updated[index].selling_price - updated[index].discount;
    
    setSelectedParts(updated);
  };

  const calculateSubTotal = () => {
    return selectedParts.reduce((sum, part) => sum + part.amount, 0);
  };

  const calculateTotalDiscount = () => {
    return selectedParts.reduce((sum, part) => sum + (part.discount * part.quantity), 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubTotal() - calculateTotalDiscount();
  };

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PrintPreviewModal = () => (
    <div className="print-preview-overlay">
      <div className="print-preview-container">
        <div className="print-preview-header">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Print Preview</h3>
            <p className="text-sm text-gray-600">Review your invoice before printing</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiPrinter />
              Print
            </button>
            <button
              onClick={closePrintPreview}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <FiX />
              Close
            </button>
          </div>
        </div>
        
        <div className="print-preview-content">
          {/* Company Header */}
          <div className="company-header">
            <div className="brand-badges">
              <img src="/badges/Volkswagen.png" alt="Volkswagen" />
              <img src="/badges/Audi.jpg" alt="Audi" />
              <img src="/badges/Seat.png" alt="Seat" />
              <img src="/badges/Skoda.jpg" alt="Skoda" />
            </div>
            <div className="company-name">EU Auto Parts</div>
            <div className="company-details">
              166/3, Kaolin Refinery Road, Werahera, Boralesgamuwa, Sri Lanka.<br/>
              Tel: 0706333555<br/>
              E-mail: euautoparts@gmail.com &nbsp;&nbsp;&nbsp;&nbsp; Reg No. - J 28994
            </div>
          </div>

          {/* Invoice Title */}
          <div className="invoice-title">INVOICE</div>

          {/* Invoice Header */}
          <div className="invoice-header">
            <div className="invoice-details">
              <div>Customer Name: {formData.customer_name}</div>
              <div>Address & Tel No:</div>
              <div>P.O #:</div>
            </div>
            <div className="invoice-details">
              <div>Inv No: {formData.inv_no}</div>
              <div>Date: {formData.date}</div>
              <div>Mode of Payment:</div>
            </div>
            <div className="invoice-details">
              <div>Vehicle #: {formData.vehicle_no}</div>
            </div>
          </div>

          {/* Parts Table */}
          <table className="parts-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'center' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Value</th>
                <th style={{ textAlign: 'right' }}>Discount</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedParts.map((part, index) => (
                <tr key={part.id}>
                  <td>{part.part_no}</td>
                  <td>{part.description}</td>
                  <td style={{ textAlign: 'center' }}>${part.selling_price.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>{part.quantity}</td>
                  <td style={{ textAlign: 'right' }}>${(part.selling_price * part.quantity).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>${(part.discount * part.quantity).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>${part.amount.toFixed(2)}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 8 - selectedParts.length) }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="totals-section">
            <div style={{ border: '1px solid black', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid black' }}>
                <span>Invoice Value</span>
                <span>${calculateSubTotal().toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', paddingBottom: '4px', borderBottom: '1px solid black' }}>
                <span>Advance Paid</span>
                <span>${formData.advance_paid.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontWeight: 'bold' }}>
                <span>Balance Amount</span>
                <span>${(calculateGrandTotal() + formData.advance_paid).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="signature-section">
            <div className="signature-box">
              <div>Transaction ID : _________________</div>
              <div className="signature-line">Invoiced By</div>
            </div>
            <div className="signature-box">
              <div className="signature-line">Checked By</div>
            </div>
            <div className="signature-box">
              <div className="signature-line">Received By</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handlePrintPreview = () => {
    setShowPrintPreview(true);
  };

  const handlePrint = () => {
    setShowPrintPreview(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const closePrintPreview = () => {
    setShowPrintPreview(false);
  };

  const handleSave = async () => {
    if (!formData.customer_name) {
      window.electronAPI.notification.show('Error', 'Please fill in customer name');
      return;
    }

    if (selectedParts.length === 0) {
      window.electronAPI.notification.show('Error', 'Please add at least one part');
      return;
    }

    setLoading(true);
    try {
      // Generate the actual invoice number only when saving
      const actualInvoiceNo = await generateActualInvoiceNo();
      if (!actualInvoiceNo) {
        throw new Error('Failed to generate invoice number');
      }

      const totalAmount = calculateSubTotal();
      const balanceDue = totalAmount + formData.advance_paid;

      // Save the invoice to database
      const result = await window.electronAPI.database.query(
        'run',
        `INSERT INTO invoices (
          inv_no, job_no, customer_name, vehicle_no, invoice_date,
          total_amount, advance_paid, balance_due
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          actualInvoiceNo,
          formData.job_no,
          formData.customer_name,
          formData.vehicle_no,
          formData.date,
          totalAmount,
          formData.advance_paid,
          balanceDue
        ]
      );

      if (result && (result.lastInsertRowid || result.lastID)) {
        // Save invoice items
        for (const part of selectedParts) {
          await window.electronAPI.database.query(
            'run',
            `INSERT INTO invoice_items (
              invoice_id, code, description, quantity, unit_price,
              selling_price, discount, amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              result.lastInsertRowid || result.lastID,
              part.code,
              part.description,
              part.quantity,
              part.unit_price,
              part.selling_price,
              part.discount,
              part.amount
            ]
          );
        }

        // Update the form data with the actual invoice number
        setFormData(prev => ({ ...prev, inv_no: actualInvoiceNo }));

        window.electronAPI.notification.show('Success', `Invoice ${actualInvoiceNo} saved successfully`);
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      console.error('Error details:', error.message);
      if (error.message?.includes('UNIQUE constraint failed')) {
        window.electronAPI.notification.show('Error', 'Invoice number already exists');
      } else if (error.message?.includes('no such table: invoices')) {
        window.electronAPI.notification.show('Error', 'Database not ready. Please restart the application.');
      } else {
        window.electronAPI.notification.show('Error', `Failed to save invoice: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

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
            
            .print-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
            }
            
            .company-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid black;
              padding-bottom: 20px;
            }
            
            .brand-badges {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }
            
            .brand-badges img {
              height: 50px;
              object-fit: contain;
              max-width: 120px;
            }
            
            .company-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
              color: black !important;
            }
            
            .company-details {
              font-size: 12px;
              line-height: 1.4;
              color: black !important;
            }
            
            .invoice-title {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              margin: 20px 0;
              color: black !important;
            }
            
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            
            .invoice-details {
              font-size: 14px;
              line-height: 1.6;
              color: black !important;
            }
            
            .parts-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 12px;
            }
            
            .parts-table th,
            .parts-table td {
              border: 1px solid black;
              padding: 8px;
              text-align: left;
              color: black !important;
            }
            
            .parts-table th {
              background-color: #f0f0f0 !important;
              font-weight: bold;
            }
            
            .text-right {
              text-align: right !important;
            }
            
            .text-center {
              text-align: center !important;
            }
            
            .totals-section {
              margin-top: 20px;
              float: right;
              width: 300px;
            }
            
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              clear: both;
            }
            
            .signature-box {
              width: 200px;
              text-align: center;
            }
            
            .signature-line {
              border-top: 1px solid black;
              margin-top: 30px;
              padding-top: 5px;
              font-size: 12px;
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
            padding: 40px;
            background: white;
            color: black;
            font-family: Arial, sans-serif;
          }
          
          .print-preview-content .company-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid black;
            padding-bottom: 20px;
          }
          
          .print-preview-content .brand-badges {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          
          .print-preview-content .brand-badges img {
            height: 50px;
            object-fit: contain;
            max-width: 120px;
          }
          
          .print-preview-content .company-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            color: black;
          }
          
          .print-preview-content .company-details {
            font-size: 12px;
            line-height: 1.4;
            color: black;
          }
          
          .print-preview-content .invoice-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            color: black;
          }
          
          .print-preview-content .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          
          .print-preview-content .invoice-details {
            font-size: 14px;
            line-height: 1.6;
            color: black;
          }
          
          .print-preview-content .parts-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
          }
          
          .print-preview-content .parts-table th,
          .print-preview-content .parts-table td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
            color: black;
          }
          
          .print-preview-content .parts-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .print-preview-content .totals-section {
            margin-top: 20px;
            float: right;
            width: 300px;
          }
          
          .print-preview-content .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            clear: both;
          }
          
          .print-preview-content .signature-box {
            width: 200px;
            text-align: center;
          }
          
          .print-preview-content .signature-line {
            border-top: 1px solid black;
            margin-top: 30px;
            padding-top: 5px;
            font-size: 12px;
          }
        `
      }} />

      <div className="max-w-7xl mx-auto p-6 bg-gray-900 min-h-screen">
        {/* Header - Hidden in print */}
        <div className="mb-6 print-hidden">
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft />
            <span>Back to Invoices</span>
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 print-container">
          {/* Company Header - Only visible in print */}
          <div className="company-header hidden print:block">
            <div className="brand-badges mb-4">
              <img src="/badges/Volkswagen.png" alt="Volkswagen" />
              <img src="/badges/Audi.jpg" alt="Audi" />
              <img src="/badges/Seat.png" alt="Seat" />
              <img src="/badges/Skoda.jpg" alt="Skoda" />
            </div>
            <div className="company-name">EU Auto Parts</div>
            <div className="company-details">
              166/3, Kaolin Refinery Road, Werahera, Boralesgamuwa, Sri Lanka.<br/>
              Tel: 0706333555<br/>
              E-mail: euautoparts@gmail.com &nbsp;&nbsp;&nbsp;&nbsp; Reg No. - J 28994
            </div>
          </div>

          {/* Screen Title - Hidden in print */}
          <h1 className="text-2xl font-bold text-white mb-6 print-hidden">INVOICE</h1>
          
          {/* Print Title - Only visible in print */}
          <div className="invoice-title hidden print:block">INVOICE</div>

          {/* Invoice Header */}
          <div className="invoice-header hidden print:block">
            <div className="invoice-details">
              <div>Customer Name: {formData.customer_name}</div>
              <div>Address & Tel No:</div>
              <div>P.O #:</div>
            </div>
            <div className="invoice-details">
              <div>Inv No: {formData.inv_no}</div>
              <div>Date: {formData.date}</div>
              <div>Mode of Payment:</div>
            </div>
            <div className="invoice-details">
              <div>Vehicle #: {formData.vehicle_no}</div>
            </div>
          </div>

          {/* Screen Form - Hidden in print */}
          <div className="print-hidden">
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Inv No.</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.inv_no}
                    readOnly
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-yellow-400">
                    (Preview)
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Days</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Job No.</label>
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle No.</label>
                <input
                  type="text"
                  value={formData.vehicle_no}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_no: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter vehicle number"
                />
              </div>
            </div>
          </div>

        {/* Parts & Services Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Parts & Services</h3>
            <button
              onClick={() => setShowPartSelector(!showPartSelector)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiPlus />
              Add Part
            </button>
          </div>

          {showPartSelector && (
            <div className="bg-gray-750 rounded-lg p-4 mb-4 border border-gray-600">
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search parts..."
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredParts.map(part => (
                  <div
                    key={part.id}
                    onClick={() => handleAddPart(part)}
                    className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">{part.name}</p>
                        <p className="text-sm text-gray-400">
                          {part.part_number} • Stock: {part.current_stock}
                        </p>
                      </div>
                      <p className="font-medium text-white">
                        ${part.final_selling_price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="border-r border-gray-600 px-3 py-3 text-left font-medium text-gray-200">Code</th>
                  <th className="border-r border-gray-600 px-3 py-3 text-left font-medium text-gray-200">Description</th>
                  <th className="border-r border-gray-600 px-3 py-3 text-center font-medium text-gray-200">Qty</th>
                  <th className="border-r border-gray-600 px-3 py-3 text-center font-medium text-gray-200">Unit Price</th>
                  <th className="border-r border-gray-600 px-3 py-3 text-right font-medium text-gray-200">Discount</th>
                  <th className="border-r border-gray-600 px-3 py-3 text-right font-medium text-gray-200">Selling Price</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-200">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800">
                {selectedParts.map((part, index) => (
                  <tr key={part.id} className="border-t border-gray-700">
                    <td className="border-r border-gray-700 px-3 py-2 text-white">{part.code}</td>
                    <td className="border-r border-gray-700 px-3 py-2 text-white">{part.description}</td>
                    <td className="border-r border-gray-700 px-3 py-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                        className="w-16 text-center bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 font-medium text-sm"
                        style={{ WebkitAppearance: 'textfield', MozAppearance: 'textfield' }}
                      />
                    </td>
                    <td className="border-r border-gray-700 px-3 py-2 text-center text-white">
                      ${part.unit_price.toFixed(2)}
                    </td>
                    <td className="border-r border-gray-700 px-3 py-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={part.discount}
                        onChange={(e) => handlePriceChange(index, 'discount', e.target.value)}
                        className="w-20 text-right bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 font-medium text-sm"
                        style={{ WebkitAppearance: 'textfield', MozAppearance: 'textfield' }}
                      />
                    </td>
                    <td className="border-r border-gray-700 px-3 py-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={part.selling_price}
                        onChange={(e) => handlePriceChange(index, 'selling_price', e.target.value)}
                        className="w-20 text-right bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 font-medium text-sm"
                        style={{ WebkitAppearance: 'textfield', MozAppearance: 'textfield' }}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-white font-medium">
                      ${(part.selling_price - part.discount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Total row with summary */}
                {selectedParts.length > 0 && (
                  <>
                    <tr className="border-t-2 border-gray-600 bg-gray-750">
                      <td className="border-r border-gray-700 px-3 py-2 text-white font-semibold">Total</td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2 text-center text-white font-semibold">
                        {selectedParts.reduce((sum, part) => sum + part.quantity, 0)}
                      </td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="px-3 py-2 text-right text-white font-semibold">
                        ${calculateSubTotal().toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-700 bg-gray-750">
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2 text-white font-medium">Advance Paid:</td>
                      <td className="px-3 py-2 text-right text-white font-medium">
                        ${formData.advance_paid.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-700 bg-gray-750">
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2"></td>
                      <td className="border-r border-gray-700 px-3 py-2 text-white font-semibold">Balance Due:</td>
                      <td className="px-3 py-2 text-right text-white font-semibold">
                        ${(calculateSubTotal() + formData.advance_paid).toFixed(2)}
                      </td>
                    </tr>
                  </>
                )}
                {/* Empty rows to fill space */}
                {Array.from({ length: Math.max(0, 8 - selectedParts.length - (selectedParts.length > 0 ? 3 : 0)) }).map((_, index) => (
                  <tr key={`empty-${index}`} className="border-t border-gray-700">
                    <td className="border-r border-gray-700 px-3 py-3 h-12">&nbsp;</td>
                    <td className="border-r border-gray-700 px-3 py-3">&nbsp;</td>
                    <td className="border-r border-gray-700 px-3 py-3">&nbsp;</td>
                    <td className="border-r border-gray-700 px-3 py-3">&nbsp;</td>
                    <td className="border-r border-gray-700 px-3 py-3">&nbsp;</td>
                    <td className="border-r border-gray-700 px-3 py-3">&nbsp;</td>
                    <td className="px-3 py-3">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Section - Only visible in print */}
        <div className="hidden print:block signature-section">
          <div className="signature-box">
            <div>Transaction ID : _________________</div>
            <div className="signature-line">Invoiced By</div>
          </div>
          <div className="signature-box">
            <div className="signature-line">Checked By</div>
          </div>
          <div className="signature-box">
            <div className="signature-line">Received By</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 print:hidden">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FiSave />
            {loading ? 'Saving...' : 'Save Invoice'}
          </button>
          <button
            onClick={handlePrintPreview}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiEye />
            Print Preview
          </button>
        </div>
      </div>
    </div>

    {/* Print Preview Modal */}
    {showPrintPreview && <PrintPreviewModal />}
    </>
  );
};

export default Invoice;