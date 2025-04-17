# CloudVault

CloudVault is a personal cloud storage solution inspired by Apple's design language. It allows users to store, organize, and preview files with ease. The project features a React-based frontend and a Node.js backend.

## Features

- **User Authentication**: Secure login and registration using Passport.js.
- **File Management**: Upload, organize, and preview files.
- **Folder Management**: Create and manage folders.
- **Storage Statistics**: View storage usage and statistics.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Tech Stack

### Frontend
- React
- Tailwind CSS
- Framer Motion
- React Query

### Backend
- Node.js
- Express
- SQLite (via Drizzle ORM)
- Passport.js for authentication

### Other Tools
- Vite for development and build
- Multer for file uploads
- Zod for schema validation

## Installation

### Prerequisites
- Node.js (v16 or later)
- npm or yarn

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd CloudVault
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the project for production.
- `npm run start`: Start the production server.
- `npm run check`: Type-check the project.
- `npm run db:push`: Push database migrations.

## License

This project is licensed under the MIT License.