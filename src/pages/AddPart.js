import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

const AddPart = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    part_number: '',
    name: '',
    description: '',
    part_type: 'new',
    cost_price: '',
    selling_price: '',
    final_selling_price: '',
    low_stock_threshold: 10,
    supplier: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate final selling price if both cost and selling are provided
      if (name === 'cost_price' || name === 'selling_price') {
        const cost = parseFloat(updated.cost_price) || 0;
        const selling = parseFloat(updated.selling_price) || 0;
        if (cost > 0 && selling > 0) {
          updated.final_selling_price = selling.toFixed(2);
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await window.electronAPI.database.query(
        'run',
        `INSERT INTO parts (
          part_number, name, description, part_type, 
          cost_price, selling_price, final_selling_price, 
          low_stock_threshold, current_stock, supplier
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          formData.part_number,
          formData.name,
          formData.description,
          formData.part_type,
          parseFloat(formData.cost_price) || 0,
          parseFloat(formData.selling_price) || 0,
          parseFloat(formData.final_selling_price) || 0,
          parseInt(formData.low_stock_threshold) || 10,
          formData.supplier
        ]
      );

      window.electronAPI.notification.show('Success', 'Part added successfully');
      navigate('/inventory');
    } catch (error) {
      console.error('Error adding part:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        window.electronAPI.notification.show('Error', 'Part number already exists');
      } else {
        window.electronAPI.notification.show('Error', 'Failed to add part');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Inventory</span>
        </button>
      </div>

      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Part</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Part Number */}
            <div>
              <label htmlFor="part_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Part Number *
              </label>
              <input
                type="text"
                id="part_number"
                name="part_number"
                className="input-field"
                value={formData.part_number}
                onChange={handleChange}
                required
                placeholder="e.g., BRK-001"
              />
            </div>

            {/* Part Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Part Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="input-field"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Brake Pad Set"
              />
            </div>

            {/* Part Type */}
            <div>
              <label htmlFor="part_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Part Type *
              </label>
              <select
                id="part_type"
                name="part_type"
                className="select-field"
                value={formData.part_type}
                onChange={handleChange}
                required
              >
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>

            {/* Cost Price */}
            <div>
              <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Part Cost ($) *
              </label>
              <input
                type="number"
                id="cost_price"
                name="cost_price"
                className="input-field"
                value={formData.cost_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selling Price ($) *
              </label>
              <input
                type="number"
                id="selling_price"
                name="selling_price"
                className="input-field"
                value={formData.selling_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>

            {/* Final Selling Price */}
            <div>
              <label htmlFor="final_selling_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Final Selling Price ($) *
              </label>
              <input
                type="number"
                id="final_selling_price"
                name="final_selling_price"
                className="input-field"
                value={formData.final_selling_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="Auto-calculated or custom"
              />
            </div>

            {/* Low Stock Threshold */}
            <div>
              <label htmlFor="low_stock_threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Low Stock Alert Threshold *
              </label>
              <input
                type="number"
                id="low_stock_threshold"
                name="low_stock_threshold"
                className="input-field"
                value={formData.low_stock_threshold}
                onChange={handleChange}
                min="1"
                required
                placeholder="10"
              />
            </div>

            {/* Supplier */}
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supplier
              </label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                className="input-field"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Enter supplier or import location"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="input-field"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter a brief description of the part..."
            />
          </div>

          {/* Profit Margin Display */}
          {formData.cost_price && formData.final_selling_price && (
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Profit Margin: 
                <span className="font-semibold text-primary-600 dark:text-primary-400 ml-2">
                  ${(parseFloat(formData.final_selling_price) - parseFloat(formData.cost_price)).toFixed(2)} 
                  ({((parseFloat(formData.final_selling_price) - parseFloat(formData.cost_price)) / parseFloat(formData.cost_price) * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          )}

          {/* Box Character Table */}
          <div className="font-mono whitespace-pre my-4">
            {'┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐\n'}
            {'│     │     │     │     │     │     │     │     │\n'}
            {'├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤\n'}
            {'│     │     │     │     │     │     │     │     │\n'}
            {'├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤\n'}
            {'│     │     │     │     │     │     │     │     │\n'}
            {'└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘'}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <FiSave />
              {loading ? 'Adding...' : 'Add Part'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPart;