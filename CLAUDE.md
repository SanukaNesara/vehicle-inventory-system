# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoParts Pro is a vehicle inventory management system built as an Electron desktop app with React frontend and SQLite database. The app supports both offline operation and optional cloud sync via Supabase.

## Architecture

**Frontend**: React 18 with React Router for navigation, Tailwind CSS for styling, and Recharts for data visualization
**Backend**: Electron main process handles database operations and system integration
**Database**: SQLite3 for local storage, with optional Supabase PostgreSQL sync
**Build System**: React Scripts for frontend bundling, Electron Builder for desktop packaging

Key architectural patterns:
- Main Electron process (`electron/main.js`) manages database and system APIs
- Renderer process communicates via IPC through preload script (`electron/preload.js`)
- Database operations centralized in `electron/database.js`
- Cloud sync handled by `electron/supabase-sync.js`
- Pages follow consistent structure with hooks for database operations

## Core Application Structure

**Electron Architecture**:
- `electron/main.js`: Main process with database initialization, IPC handlers, and application lifecycle
- `electron/preload.js`: Secure IPC bridge exposing `electronAPI` to renderer (database queries, notifications, sync)
- `electron/database.js`: SQLite operations with automatic schema creation and photo column management
- `electron/migrate-db.js`: Database migrations with proper local timestamp handling
- `electron/supabase-sync.js`: Two-way cloud synchronization with conflict resolution

**React Frontend**:
- `src/App.js`: Main app with routing, theme provider, error boundary, and Electron navigation listeners
- `src/pages/`: Feature pages (Dashboard, Inventory with photo support, JobCards, Estimates, etc.)
- `src/components/`: Reusable UI components (Sidebar, SyncStatus, ErrorBoundary)
- `src/contexts/ThemeContext.js`: Dark/light theme management
- `src/utils/`: Web API compatibility layers for non-Electron environments

**Data Flow**:
- UI components call `window.electronAPI.database.query()` for database operations
- All database calls go through IPC to main process for security
- Local SQLite with automatic cloud sync when Supabase credentials available
- Photo storage as base64 strings in database with graceful fallbacks

## Development Commands

```bash
# Start development with hot reload (runs React dev server + Electron)
npm start

# Start React dev server only
npm run react-start

# Start Electron only (requires React server running)
npm run electron-start

# Build React app for production
npm run build

# Run React tests
npm run test

# Test build without packaging
npm run electron-pack -- --dir

# Package for current platform
npm run electron-pack

# Package for specific platforms
npm run electron-pack:win    # Windows
npm run electron-pack:mac    # macOS  
npm run electron-pack:linux  # Linux

# Build and package
npm run dist

# Build for all platforms
npm run dist:all

# Rebuild native dependencies (SQLite3)
npm run rebuild
```

## Database Architecture

**Local Database**: SQLite stored in OS-specific user data directory
- Parts table with pro_no, inventory tracking, pricing, and photo support (base64 storage)
- Job cards with customer info and parts usage
- Stock movements for inventory history
- Low stock alerts system
- Counters table for auto-incrementing Pro No and Job No
- Estimates with line items and totals

**Schema Migration**: Handled by `electron/migrate-db.js` with automatic column additions
- Photo column migration with graceful fallbacks
- Local timestamp correction (uses `datetime('now','localtime')` instead of UTC)
- Backward compatibility with existing data

**Cloud Sync**: Optional Supabase integration
- Two-way sync between local SQLite and remote PostgreSQL
- Conflict resolution based on updated_at timestamps
- Auto-sync every 5 minutes when configured
- Sync status indicator in UI

## Key Features and Implementation Details

**Photo Management**:
- Parts support photo upload with base64 storage in SQLite
- Graceful fallbacks when photo column doesn't exist
- Photo preview in inventory table and full-size display in details modal
- Image validation and error handling

**Inventory System**:
- Parts with Pro No generation, pricing tiers, and stock tracking
- Part details modal with comprehensive information display
- Photo thumbnails in inventory table with details view
- Stock movement history with IN/OUT tracking

**Time Handling**:
- Corrected timezone issues using local timestamps
- Custom date formatting functions for accurate display
- Database uses `datetime('now','localtime')` for new records
- Backward compatibility with existing UTC timestamps

**Job Cards Workflow**:
- Create jobs with customer details and vehicle information
- Select parts from inventory with automatic stock deduction
- Status tracking (pending/completed/cancelled) with stock updates
- Parts usage tracking and history

**UI/UX Patterns**:
- Dark/light theme with system preference detection
- Consistent modal patterns for details views
- Error boundaries and graceful error handling
- Navigation integration with Electron menu system

## Native Dependencies

SQLite3 requires rebuilding for Electron:
```bash
npx electron-rebuild -f -w sqlite3
```

For distribution builds:
```bash
npm rebuild sqlite3 --runtime=electron --target=22.0.0 --dist-url=https://atom.io/download/electron
```

## Testing

Use `npm run test` (which runs `react-scripts test`) for React component testing. No additional test frameworks configured. Testing runs in interactive watch mode by default.

## Database Access

Local database file location varies by OS - see DATABASE_MANAGEMENT.md for direct database access instructions and schema details.

## Development Patterns

**Adding New Features**:
- Use existing patterns from pages like `AddPart.js` and `Inventory.js`
- Database operations through `window.electronAPI.database.query()`
- Follow existing modal patterns for details views
- Include photo support and timestamp handling for new entities

**Database Changes**:
- Add migrations to `electron/migrate-db.js` using `safeAlterTable()`
- Update `electron/database.js` table creation for new installations
- Use local timestamps: `datetime('now','localtime')` instead of `CURRENT_TIMESTAMP`
- Handle column existence gracefully with try-catch patterns

**Photo Integration**:
- Store as base64 strings in TEXT columns
- Use file input with base64 conversion for uploads
- Include fallback queries for databases without photo columns
- Display thumbnails in tables and full images in modals

**Error Handling**:
- Use try-catch blocks around database operations
- Provide user-friendly error messages via `window.electronAPI.notification.show()`
- Log detailed errors to console for debugging
- Handle missing columns and database schema differences gracefully