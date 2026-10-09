# Training Centre Admin Portal

A modern, role-based web application for managing community workshop registrations, staff accounts, and operational activity tracking. Designed with a clean, dynamic, and intuitive user interface tailored for different administrative roles.

## Architecture & Technologies

The application is built using a decoupled client-server architecture.

### Technologies Used
- **Frontend (Client):** React, Vite, Tailwind CSS v4, React Router DOM
- **Backend (Server):** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Containerization:** Docker & Docker Compose

### Folder Overview
- `/client`: React frontend application.
  - `/src/pages`: Main view components (Workshops, Users, ActivityLog, Login).
  - `/src/components`: Reusable UI elements (Layout, WorkshopForm).
  - `/src/AuthContext.jsx`: Global authentication and role management state.
- `/server`: Node.js Express backend application.
  - `/src/routes`: API endpoints grouped by feature.
  - `/src/models`: Mongoose database schemas.

## Data Model

- **User**: Stores staff accounts, including credentials (hashed) and roles (`admin`, `manager`, `staff`).
- **Workshop**: Contains details for each workshop (title, instructor, capacity, schedule, location).
- **Registration**: Tracks attendee sign-ups for workshops, handling seat availability and cancellations.
- **AuditLog**: Immutable record of critical system actions (logins, creations, cancellations) for security and accountability.

## Features & Roles

- **Admin Console**: Full access. Can manage workshops, staff accounts, and view tamper-evident activity logs.
- **Manager (Operations)**: Can manage workshops, view participants, and export activity logs.
- **Staff (Front Desk)**: Can view workshops, register participants, and process cancellations.

### Demo Credentials

You can use the following credentials to explore the different role-based views in the application:

| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Admin   | admin@demo.com     | Admin123!   |
| Manager | manager@demo.com   | Manager123! |
| Staff   | staff@demo.com     | Staff123!   |

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or via Docker)

### 1. Start MongoDB (Optional)
If you don't have MongoDB installed locally, you can use the provided Docker Compose file:
```bash
docker compose up -d
```

### 2. Backend Setup
Navigate to the server directory, install dependencies, and start the development server:
```bash
cd server
npm install
npm run seed  # Optional: Seed the database with demo users
npm run dev
```

### 3. Frontend Setup
In a new terminal window, navigate to the client directory, install dependencies, and start Vite:
```bash
cd client
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.