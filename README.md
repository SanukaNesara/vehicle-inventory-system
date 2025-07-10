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
- **Photo Support** - Upload and display part photos with base64 storage
- **Invoice System** - Professional invoice generation with print support
- **Estimates** - Create detailed service estimates
- **Reports** - Comprehensive business analytics

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation & Running

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/vehicle-inventory-system.git
cd vehicle-inventory-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the application**

```bash
npm start
```

The app will automatically:

- Start the React development server
- Open the Electron desktop application
- Initialize the database (mock mode for development)

## 💻 Development Commands

```bash
# Start development with hot reload
npm start

# Start React dev server only
npm run react-start

# Start Electron only (requires React server)
npm run electron-start

# Build React app for production
npm run build

# Run tests
npm run test

# Package for current platform
npm run electron-pack

# Build and package
npm run dist
```

## 📦 Building Executables

### For Current Platform

```bash
npm run build
npm run electron-pack
```

### For Specific Platforms

```bash
# Windows
npm run electron-pack:win

# macOS
npm run electron-pack:mac

# Linux
npm run electron-pack:linux

# All platforms
npm run dist:all
```

### Cross-Platform Building

#### Windows Build (from macOS/Linux)

1. **Using GitHub Actions** (Recommended)

   - Push to GitHub repository
   - Actions will automatically build for all platforms
   - Download artifacts from Actions tab

2. **Using Windows Machine**
   - Transfer project to Windows
   - Install Node.js and npm
   - Run: `npm install && npm run dist`

#### Build Output

- **Windows**: `dist/AutoParts Pro Setup 1.0.0.exe`
- **macOS**: `dist/AutoParts Pro-1.0.0-arm64.dmg`
- **Linux**: `dist/AutoParts Pro-1.0.0.AppImage`

## 🗄️ Database

### Local Database

- **Location**: OS-specific user data directory
  - macOS: `~/Library/Application Support/vehicle-inventory-system/`
  - Windows: `%APPDATA%/vehicle-inventory-system/`
  - Linux: `~/.config/vehicle-inventory-system/`

### Database Schema

- **Parts**: Inventory items with pricing, stock, and photos
- **Stock Movements**: Inventory transaction history
- **Job Cards**: Service jobs with customer details
- **Job Card Parts**: Parts used in jobs
- **Low Stock Alerts**: Automated stock monitoring

### Database Management

Use [DB Browser for SQLite](https://sqlitebrowser.org/) to directly manage the database file.

## 🗄️ Database Storage

The application uses SQLite for reliable local data storage. No cloud setup is required - the database is automatically created when you first run the app.

## 🏗️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router
- **Desktop**: Electron 22
- **Database**: SQLite3 with better-sqlite3
- **Charts**: Recharts
- **Icons**: React Icons
- **Build**: Electron Builder

## 📱 Application Features

### Dashboard

- Real-time statistics and KPIs
- Revenue and cost tracking
- Job status overview
- Low stock alerts
- Recent activities

### Inventory Management

- Add parts with detailed information
- Photo upload and display
- Part type classification (new/used)
- Pricing and profit margin management
- Advanced search and filtering

### Job Cards

- Create repair jobs with customer details
- Vehicle information tracking
- Part selection from inventory
- Automatic stock deduction
- Status tracking (pending/completed/cancelled)

### Stock Management

- Add stock with dynamic pricing
- Low stock threshold monitoring
- Movement history tracking
- Detailed stock reports
- Automated alerts

### Invoicing & Estimates

- Professional invoice generation
- Print-ready formatting
- Service estimates
- Customer management
- Pricing calculations

## 🔧 Troubleshooting

### Common Issues

#### White Screen on Startup

- Ensure `npm run build` has been executed
- Check developer tools console for errors
- Verify all dependencies are installed

#### SQLite3 Errors

- **WSL2 Users**: Run on native Windows or use Docker
- **Native Dependencies**: Run `npm rebuild sqlite3 --runtime=electron`
- **Fallback**: App uses mock database if SQLite3 unavailable

#### Build Failures

```bash
# Clean rebuild
rm -rf node_modules dist build
npm install
npm run build
npm run electron-pack
```

### Performance

- Development uses mock database for fast startup
- Production builds include native SQLite3
- Images stored as base64 in database

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

Built with ❤️ for auto parts professionals

---

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed description

**Happy inventory management!** 🚗✨
