# AutoParts Pro - Vehicle Inventory Management System

A modern, feature-rich inventory management system for auto parts shops built with React, Electron, and SQLite.

![AutoParts Pro](https://img.shields.io/badge/AutoParts-Pro-blue)
![Electron](https://img.shields.io/badge/Electron-22.0.0-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)

## ✨ Features

- **Modern UI with Dark Mode** - Clean, responsive interface with dark/light theme support
- **Parts Management** - Add and track parts with pricing, stock levels, and type (new/used)
- **Stock Control** - Dynamic stock management with price updates and low stock alerts
- **Job Cards System** - Create and manage repair jobs with automatic inventory tracking
- **Real-time Dashboard** - View statistics, charts, and recent activities
- **Low Stock Alerts** - Automatic notifications when parts run low
- **Stock History** - Track all inventory movements with detailed filtering

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/vehicle-inventory-system.git
cd vehicle-inventory-system
```

2. Install dependencies
```bash
npm install
```

3. Rebuild native modules for Electron
```bash
npx electron-rebuild -f -w sqlite3
```

4. Start the application
```bash
npm start
```

## 💻 Development

- `npm start` - Start the development server with hot reload
- `npm run build` - Build the React app for production
- `npm run electron-pack` - Package the Electron app for distribution

## 🏗️ Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **Desktop**: Electron
- **Database**: SQLite3
- **Charts**: Recharts
- **Icons**: React Icons

## 📱 Features Overview

### Dashboard
- Real-time statistics
- Revenue tracking
- Job status overview
- Low stock alerts

### Inventory Management
- Add new parts with detailed information
- Track part types (new/used)
- Manage pricing and profit margins
- Filter and search capabilities

### Job Cards
- Create repair jobs with customer details
- Select parts from inventory
- Automatic stock deduction on job completion
- Job status tracking (pending/completed/cancelled)

### Stock Management
- Add stock with dynamic pricing
- Low stock threshold alerts
- Movement history tracking
- Detailed stock reports

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Author

Built with ❤️ by [Your Name]