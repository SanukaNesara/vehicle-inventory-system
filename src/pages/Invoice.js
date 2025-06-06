import React, { useState, useEffect } from 'react';
import { FiSave, FiPrinter, FiX, FiPlus, FiTrash2, FiSearch, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const Invoice = () => {
  const [formData, setFormData] = useState({
    inv_no: '',
    job_no: '',
    vehicle_no: '',
    customer_name: '',
    inv_date: new Date().toISOString().split('T')[0],
    days: ''
  });

  const [items, setItems] = useState([]);
  const [customerOutstanding, setCustomerOutstanding] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [total, setTotal] = useState(0);
  const [jobCards, setJobCards] = useState([]);
  const [vehicleNumbers, setVehicleNumbers] = useState([]);
  const [showPartModal, setShowPartModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobCards();
    fetchVehicleNumbers();
  }, []);

  useEffect(() => {
    // Calculate quantity whenever items change
    const qty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setQuantity(qty);
  }, [items]);

  const fetchVehicleNumbers = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        `SELECT DISTINCT j1.vehicle_no 
         FROM job_cards j1
         WHERE j1.vehicle_no IS NOT NULL 
         AND LOWER(j1.status) != LOWER('canceled')
         AND LOWER(j1.status) != LOWER('cancelled')
         AND LOWER(j1.status) != LOWER('removed')
         AND EXISTS (
           SELECT 1 FROM job_cards j2 
           WHERE j2.vehicle_no = j1.vehicle_no 
           AND LOWER(j2.status) NOT IN (LOWER('canceled'), LOWER('cancelled'), LOWER('removed'))
         )
         ORDER BY j1.vehicle_no`
      );
      setVehicleNumbers(result || []);
    } catch (error) {
      console.error('Error fetching vehicle numbers:', error);
    }
  };

  const fetchJobCards = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        `SELECT * FROM job_cards 
         WHERE LOWER(status) != LOWER('canceled') 
         AND LOWER(status) != LOWER('removed')
         AND LOWER(status) != LOWER('cancelled')
         ORDER BY created_at DESC`
      );
      setJobCards(result || []);
    } catch (error) {
      console.error('Error fetching job cards:', error);
    }
  };

  const handleVehicleSelect = async (vehicleNo) => {
    if (!vehicleNo) {
      setFormData({
        ...formData,
        vehicle_no: '',
        job_no: '',
        customer_name: ''
      });
      setItems([]);
      return;
    }

    try {
      // Get the most recent non-canceled job card for this vehicle
      const latestJobCard = await window.electronAPI.database.query(
        'get',
        `SELECT * FROM job_cards 
         WHERE vehicle_no = ? 
         AND LOWER(status) != LOWER('canceled')
         AND LOWER(status) != LOWER('cancelled')
         AND LOWER(status) != LOWER('removed')
         ORDER BY created_at DESC 
         LIMIT 1`,
        [vehicleNo]
      );

      if (latestJobCard) {
        setFormData({
          ...formData,
          vehicle_no: vehicleNo,
          job_no: latestJobCard.job_no,
          customer_name: latestJobCard.customer_name
        });

        // Fetch job card items
        const jobItems = await window.electronAPI.database.query(
          'all',
          `SELECT jcp.*, p.name as item_description, p.selling_price, p.part_number as pro_no
           FROM job_card_parts jcp
           JOIN parts p ON jcp.part_id = p.id
           WHERE jcp.job_card_id = ?`,
          [latestJobCard.id]
        );

        // Transform job items to invoice items format
        const transformedItems = jobItems.map(item => ({
          pro_no: item.pro_no,
          item_description: item.item_description,
          quantity: item.quantity,
          system_price: item.unit_price,
          discount: 0,
          selling_price: item.unit_price,
          print_price: item.unit_price,
          amount: item.total_price
        }));

        setItems(transformedItems);

        // Fetch customer outstanding
        const outstanding = await window.electronAPI.database.query(
          'all',
          `SELECT inv_no, inv_date as date, vehicle_no as veh_no, 
                  (total - COALESCE(paid_amount, 0)) as bal_amt
           FROM invoices 
           WHERE customer_name = ? AND status != 'paid'
           ORDER BY inv_date DESC`,
          [latestJobCard.customer_name]
        );
        setCustomerOutstanding(outstanding || []);
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    }
  };

  const handleJobCardSelect = async (jobNo) => {
    if (!jobNo) {
      setFormData({
        ...formData,
        job_no: '',
        vehicle_no: '',
        customer_name: ''
      });
      setItems([]);
      return;
    }

    try {
      const jobCard = await window.electronAPI.database.query(
        'get',
        `SELECT * FROM job_cards 
         WHERE job_no = ? 
         AND LOWER(status) != LOWER('canceled')
         AND LOWER(status) != LOWER('cancelled')
         AND LOWER(status) != LOWER('removed')`,
        [jobNo]
      );

      if (jobCard) {
        setFormData({
          ...formData,
          job_no: jobCard.job_no,
          vehicle_no: jobCard.vehicle_no,
          customer_name: jobCard.customer_name
        });

        // Fetch job card items
        const jobItems = await window.electronAPI.database.query(
          'all',
          `SELECT jcp.*, p.name as item_description, p.selling_price, p.part_number as pro_no
           FROM job_card_parts jcp
           JOIN parts p ON jcp.part_id = p.id
           WHERE jcp.job_card_id = ?`,
          [jobCard.id]
        );

        // Transform job items to invoice items format
        const transformedItems = jobItems.map(item => ({
          pro_no: item.pro_no,
          item_description: item.item_description,
          quantity: item.quantity,
          system_price: item.unit_price,
          discount: 0,
          selling_price: item.unit_price,
          print_price: item.unit_price,
          amount: item.total_price
        }));

        setItems(transformedItems);

        // Fetch customer outstanding
        const outstanding = await window.electronAPI.database.query(
          'all',
          `SELECT inv_no, inv_date as date, vehicle_no as veh_no, 
                  (total - COALESCE(paid_amount, 0)) as bal_amt
           FROM invoices 
           WHERE customer_name = ? AND status != 'paid'
           ORDER BY inv_date DESC`,
          [jobCard.customer_name]
        );
        setCustomerOutstanding(outstanding || []);
      }
    } catch (error) {
      console.error('Error fetching job card details:', error);
    }
  };

  const handleAddItem = (product) => {
    setItems([...items, {
      pro_no: product.pro_no,
      item_description: product.name,
      quantity: 1,
      system_price: product.selling_price,
      discount: 0,
      selling_price: product.selling_price,
      print_price: product.selling_price,
      amount: product.selling_price
    }]);
  };

  const searchParts = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.database.query(
        'all',
        `SELECT * FROM parts 
         WHERE (LOWER(name) LIKE LOWER(?) 
         OR LOWER(part_number) LIKE LOWER(?)
         OR LOWER(pro_no) LIKE LOWER(?))
         AND current_stock > 0
         ORDER BY name`,
        [`%${term}%`, `%${term}%`, `%${term}%`]
      );
      setSearchResults(result || []);
    } catch (error) {
      console.error('Error searching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartSelect = (part) => {
    // Check if the part already exists in items
    const existingItemIndex = items.findIndex(
      item => item.pro_no === (part.pro_no || part.part_number)
    );

    if (existingItemIndex !== -1) {
      // Part exists, update quantity and amount
      const updatedItems = [...items];
      const item = updatedItems[existingItemIndex];
      item.quantity += 1;
      item.amount = item.quantity * item.selling_price;
      setItems(updatedItems);
    } else {
      // Part doesn't exist, add new item
      const newItem = {
        pro_no: part.pro_no || part.part_number,
        item_description: part.name,
        quantity: 1,
        system_price: part.selling_price,
        discount: 0,
        selling_price: part.selling_price,
        print_price: part.selling_price,
        amount: part.selling_price
      };
      setItems([...items, newItem]);
    }
    
    setShowPartModal(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Add function to handle quantity change
  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return; // Don't allow quantities less than 1

    const updatedItems = [...items];
    const item = updatedItems[index];
    item.quantity = newQuantity;
    item.amount = newQuantity * item.selling_price;
    setItems(updatedItems);
  };

  const PartSelectionModal = () => {
    if (!showPartModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[800px] max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Select Part</h2>
            <button 
              onClick={() => {
                setShowPartModal(false);
                setSearchTerm('');
                setSearchResults([]);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="mb-4 relative">
            <input
              type="text"
              className="input-field w-full pr-10"
              placeholder="Search by part name, part number, or pro no..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchParts(e.target.value);
              }}
            />
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : searchResults.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 text-left">Part No</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-right">Stock</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((part) => (
                    <tr key={part.id} className="border-b dark:border-gray-700">
                      <td className="p-2">{part.part_number}</td>
                      <td className="p-2">{part.name}</td>
                      <td className="p-2 text-right">{part.current_stock}</td>
                      <td className="p-2 text-right">{part.selling_price}</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handlePartSelect(part)}
                          className="btn-primary py-1 px-3"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : searchTerm ? (
              <div className="text-center py-4 text-gray-500">No parts found</div>
            ) : (
              <div className="text-center py-4 text-gray-500">Type to search parts</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">INVOICE</h1>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="w-32">Inv No</label>
            <select 
              className="input-field flex-1"
              value={formData.inv_no}
              onChange={(e) => setFormData({...formData, inv_no: e.target.value})}
            >
              <option value="">Select Invoice No</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="w-32">Job No</label>
            <select 
              className="input-field flex-1"
              value={formData.job_no}
              onChange={(e) => handleJobCardSelect(e.target.value)}
            >
              <option value="">Select Job No</option>
              {jobCards.map(card => (
                <option key={card.job_no} value={card.job_no}>
                  {card.job_no}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="w-32">Vehicle No</label>
            <select 
              className="input-field flex-1"
              value={formData.vehicle_no}
              onChange={(e) => handleVehicleSelect(e.target.value)}
            >
              <option value="">Select Vehicle No</option>
              {vehicleNumbers.map(veh => (
                <option key={veh.vehicle_no} value={veh.vehicle_no}>
                  {veh.vehicle_no}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="w-32">Customer Name</label>
            <input 
              type="text"
              className="input-field flex-1"
              value={formData.customer_name}
              readOnly
            />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="w-32">Inv Date</label>
            <input 
              type="date"
              className="input-field flex-1"
              value={formData.inv_date}
              onChange={(e) => setFormData({...formData, inv_date: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowPartModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Part
        </button>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-2 w-[150px]">Pro No</th>
              <th className="p-2">Item Description</th>
              <th className="p-2 w-[100px]">Quantity</th>
              <th className="p-2 w-[120px]">System Price</th>
              <th className="p-2 w-[100px]">Discount</th>
              <th className="p-2 w-[120px]">Selling PRICE</th>
              <th className="p-2 w-[120px]">Print Price</th>
              <th className="p-2 w-[120px]">Amount</th>
              <th className="p-2 w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b dark:border-gray-700">
                <td className="p-2">{item.pro_no}</td>
                <td className="p-2">{item.item_description}</td>
                <td className="p-2">
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        handleQuantityChange(index, Math.max(1, value));
                      }}
                      className="w-16 text-center p-1 input-field"
                      min="1"
                    />
                    <div className="flex flex-col">
                      <button 
                        onClick={() => handleQuantityChange(index, item.quantity + 1)}
                        className="text-gray-500 hover:text-blue-500 focus:outline-none"
                      >
                        <FiChevronUp size={14} />
                      </button>
                      <button 
                        onClick={() => handleQuantityChange(index, Math.max(1, item.quantity - 1))}
                        className="text-gray-500 hover:text-blue-500 focus:outline-none"
                      >
                        <FiChevronDown size={14} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="p-2">{item.system_price}</td>
                <td className="p-2">{item.discount}</td>
                <td className="p-2">{item.selling_price}</td>
                <td className="p-2">{item.print_price}</td>
                <td className="p-2">{item.amount.toFixed(2)}</td>
                <td className="p-2">
                  <button
                    onClick={() => {
                      const newItems = [...items];
                      newItems.splice(index, 1);
                      setItems(newItems);
                    }}
                    className="btn-danger py-1 px-2"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Outstanding */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-bold mb-2">Customer Total Outstanding</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2">Inv No</th>
                <th className="p-2">Date</th>
                <th className="p-2">Veh No</th>
                <th className="p-2">Bal Amt</th>
              </tr>
            </thead>
            <tbody>
              {customerOutstanding.map((item, index) => (
                <tr key={index} className="border-b dark:border-gray-700">
                  <td className="p-2">{item.inv_no}</td>
                  <td className="p-2">{item.date}</td>
                  <td className="p-2">{item.veh_no}</td>
                  <td className="p-2">{item.bal_amt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Quantity:</span>
            <span className="font-bold">{quantity}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Total:</span>
            <input 
              type="number"
              className="input-field w-32"
              value={total}
              onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="btn-primary flex items-center gap-2">
          <FiPlus /> New
        </button>
        <button className="btn-secondary flex items-center gap-2">
          <FiX /> Cancel
        </button>
        <button className="btn-success flex items-center gap-2">
          <FiSave /> Complete
        </button>
        <button className="btn-danger flex items-center gap-2">
          <FiTrash2 /> Delete
        </button>
        <button className="btn-info flex items-center gap-2">
          <FiPrinter /> Print
        </button>
        <button className="btn-warning">Exit</button>
        <button className="btn-secondary">Uncomplete</button>
      </div>

      <PartSelectionModal />
    </div>
  );
};

export default Invoice; 