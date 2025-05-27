import React from 'react';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiFileText } from 'react-icons/fi';

const Reports = () => {
  const upcomingReports = [
    {
      icon: <FiBarChart2 className="w-12 h-12" />,
      title: 'Inventory Analytics',
      description: 'Detailed analysis of stock levels, turnover rates, and inventory value trends'
    },
    {
      icon: <FiPieChart className="w-12 h-12" />,
      title: 'Financial Reports',
      description: 'Profit margins, revenue analysis, and cost breakdowns by category'
    },
    {
      icon: <FiTrendingUp className="w-12 h-12" />,
      title: 'Performance Metrics',
      description: 'Job completion rates, technician performance, and customer insights'
    },
    {
      icon: <FiFileText className="w-12 h-12" />,
      title: 'Custom Reports',
      description: 'Generate and export custom reports based on your specific needs'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>

      <div className="card p-12 text-center">
        <div className="max-w-2xl mx-auto">
          <FiBarChart2 className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Advanced Reports Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We're working on powerful analytics and reporting features to help you make data-driven decisions 
            for your auto parts business.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {upcomingReports.map((report, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="text-primary-600 dark:text-primary-400 mb-3">
                  {report.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {report.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {report.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;