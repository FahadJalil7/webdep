# Kognitive Auction Portal

## Project Structure

- **backend/**: Node.js/Express backend service.
- **frontend/**: Angular frontend application.

## Prerequisites

- Node.js (v18 or higher recommended)
- Angular CLI (v17+)

## How to Run

### 1. Start the Backend server

In a terminal:
```bash
cd backend
npm install   # If not already installed
node server.js
```
The server will start on `http://localhost:3000`.

### 2. Start the Frontend application

In a separate terminal:
```bash
cd frontend
npm install   # If not already installed
ng serve
```
The application will be available at `http://localhost:4200`.

## Login Credentials (Mock)

| Role  | Email                 | Password |
|-------|-----------------------|----------|
| Admin | `admin@kognitive.com` | `admin`  |
| User  | `user@kognitive.com`  | `user`   |

## Features

- **Login**: Secure login for Users and Admins.
- **Dashboard**: Role-based dashboard view (Admin vs User).
- **Design**: Modern glassmorphism UI with dark mode.
