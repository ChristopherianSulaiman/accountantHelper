# Full Stack Application

This is a full-stack application built with Node.js, React, and MySQL.

## Project Structure
- `backend/` - Node.js/Express server
- `frontend/` - React application
- `database/` - MySQL configuration and migrations

## Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Database Setup
1. Create a MySQL database using the provided schema in `database/schema.sql`
2. Update the database credentials in the backend `.env` file

## Development
- Backend runs on: http://localhost:3000
- Frontend runs on: http://localhost:5173
- API documentation available at: http://localhost:3000/api-docs 