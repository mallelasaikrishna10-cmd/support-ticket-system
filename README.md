# Support Ticket Management System

A full-stack enterprise web application built with **React.js**, **Node.js (Express.js)**, **MySQL**, and **JWT Authentication**.

---

## 📋 Table of Contents
1. [Project Overview & Business Scenario](#-project-overview--business-scenario)
2. [User Roles & Key Capabilities](#-user-roles--key-capabilities)
3. [Technology Stack](#-technology-stack)
4. [Architecture & Folder Structure](#-architecture--folder-structure)
5. [Database Design & Schema](#-database-design--schema)
6. [Assessment Section 8: Demonstration Query](#-assessment-section-8-demonstration-query)
7. [REST API Documentation](#-rest-api-documentation)
8. [Environment Variables](#-environment-variables)
9. [Local Installation & Setup Guide](#-local-installation--setup-guide)
10. [Automated Testing & Postman Collection](#-automated-testing--postman-collection)
11. [Production Cloud Deployment Guide](#-production-cloud-deployment-guide)
12. [Pre-Seeded Demo Credentials](#-pre-seeded-demo-credentials)

---

## 🎯 Project Overview & Business Scenario

Companies need an intuitive, secure, and transparent support ticketing portal where:
* **Customers** can raise issues, track resolution progress in real time, and converse with support engineers.
* **Support Agents** can monitor the global ticket queue, prioritize critical issues, reassign workload, update ticket status, and provide official support responses.

This application provides strict tenant data isolation, role-based authorization (RBAC), parameterized SQL queries to prevent SQL injection, and a polished enterprise SaaS interface.

---

## 👥 User Roles & Key Capabilities

### 1. Customer (`role: 'customer'`)
* **Registration & Login**: Secure account creation with client validation and password hashing (bcrypt).
* **Customer Dashboard**: Overview of ticket metrics (*Total*, *Open*, *In Progress*, *Resolved*, *Closed*) and recent activity.
* **Ticket Management**: Submit new tickets (`subject`, `description`, `priority`), browse, filter by status/priority, and keyword search.
* **Conversation Thread**: View updates and post replies to own tickets.
* **Security Isolation**: **Strictly restricted** to viewing and commenting on their own tickets. Cannot access agent endpoints, reassign tickets, or delete records.

### 2. Support Agent (`role: 'agent'`)
* **Agent Operations Dashboard**: Global ticket statistics (*Total*, *Open Queue*, *In Progress*, *Resolved*, *Unassigned*), plus an **Attention Queue** for critical/urgent tickets.
* **Global Queue**: View and filter all system tickets across customers by keyword, status, priority, and assigned agent.
* **Triage & Management**:
  * Update ticket status (`open`, `in_progress`, `resolved`, `closed`).
  * Update priority (`low`, `medium`, `high`, `urgent`).
  * Assign tickets to active support agents (or leave unassigned).
  * Post official support responses.
  * Delete tickets when appropriate.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React.js 18 + Vite | Modern, high-performance Single Page Application |
| **Routing** | React Router v7 | Client-side routing with role-aware `ProtectedRoute` |
| **HTTP Client** | Axios | API communication with Bearer token interceptor |
| **Styling** | Vanilla CSS (Design System) | Custom Slate & Indigo Enterprise SaaS theme |
| **Icons** | Lucide React | Lightweight, accessible SVG icon set |
| **Backend** | Node.js + Express.js | Modular REST API service |
| **Database** | MySQL 8.0+ | Relational data persistence with foreign keys and indexes |
| **DB Driver** | `mysql2/promise` | Connection pooling and parameterized SQL execution |
| **Security** | `bcryptjs` + `jsonwebtoken` | Password hashing (cost 10) and JWT token validation |
| **Testing** | Supertest + Node Test Suite | Integration and regression testing |
| **API Testing** | Postman | Exportable collection (`postman_collection.json`) |

---

## 📁 Architecture & Folder Structure

```text
support-ticket-system/
├── frontend/                     # React Single Page Application
│   ├── src/
│   │   ├── components/           # Reusable UI (StatusBadge, PriorityBadge)
│   │   ├── context/              # AuthContext (JWT session management)
│   │   ├── layouts/              # DashboardLayout with responsive desktop/mobile nav
│   │   ├── pages/
│   │   │   ├── auth/             # LoginPage, RegisterPage
│   │   │   ├── customer/         # CustomerDashboard, MyTickets, CreateTicket, Details
│   │   │   ├── agent/            # AgentDashboard, AgentTickets, AgentDetails
│   │   │   └── NotFoundPage.jsx
│   │   ├── routes/               # AppRoutes, ProtectedRoute (RBAC Guard)
│   │   ├── services/             # api.js, authService.js, ticketService.js
│   │   ├── utils/                # date.js formatter
│   │   ├── App.jsx
│   │   └── index.css             # Design system styling
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── backend/                      # Node.js + Express REST API
│   ├── src/
│   │   ├── config/               # database.js (mysql2 pool), environment.js
│   │   ├── controllers/          # auth.controller.js, ticket.controller.js, comment.controller.js, user.controller.js
│   │   ├── middleware/           # auth.middleware.js, authorize.middleware.js, errorHandler.js, notFoundHandler.js
│   │   ├── models/               # user.model.js, ticket.model.js, comment.model.js (Parameterized SQL)
│   │   ├── routes/               # auth.routes.js, ticket.routes.js, user.routes.js, health.routes.js, index.js
│   │   ├── app.js                # Express app setup & CORS
│   │   └── server.js             # HTTP server entry point
│   ├── .env.example
│   ├── package.json
│   └── test-master-regression.js # 24/24 Master regression test suite
├── database/                     # MySQL Database scripts
│   ├── schema.sql                # Table definitions, foreign keys, indexes
│   └── seed.sql                  # Seed data with bcrypt hashed passwords
├── postman_collection.json       # Complete Postman collection export
├── .env.example                  # Root environment template
├── .gitignore                    # Git ignore rules for secrets and node_modules
└── README.md                     # Project documentation
```

---

## 🗄️ Database Design & Schema

### Tables & Relationships
1. **`users`**:
   - `id` (INT PK AI), `name` (VARCHAR), `email` (VARCHAR UNIQUE), `password_hash` (VARCHAR), `role` (ENUM: 'customer', 'agent'), `created_at` (TIMESTAMP).
2. **`tickets`**:
   - `id` (INT PK AI), `user_id` (INT FK -> users.id CASCADE), `subject` (VARCHAR), `description` (TEXT), `priority` (ENUM: 'low', 'medium', 'high', 'urgent'), `status` (ENUM: 'open', 'in_progress', 'resolved', 'closed'), `assigned_to` (INT NULL FK -> users.id SET NULL), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP).
3. **`ticket_comments`**:
   - `id` (INT PK AI), `ticket_id` (INT FK -> tickets.id CASCADE), `user_id` (INT FK -> users.id CASCADE), `comment` (TEXT), `created_at` (TIMESTAMP).

---

## 🔍 Assessment Section 8: Demonstration Query

> **Requirement**: *Write a query that returns all open tickets along with the customer's name and email using a JOIN and filtering.*

```sql
SELECT 
    t.id AS ticket_id,
    t.subject,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    t.created_at,
    u.id AS customer_id,
    u.name AS customer_name,
    u.email AS customer_email
FROM 
    tickets t
INNER JOIN 
    users u ON t.user_id = u.id
WHERE 
    t.status = 'open'
ORDER BY 
    t.created_at DESC;
```

---

## 📡 REST API Documentation

### Base URL: `http://localhost:5000/api` (or deployed API URL)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new customer account (`name`, `email`, `password`) |
| `POST` | `/auth/login` | Public | Authenticate user & receive JWT token (`email`, `password`) |
| `GET` | `/auth/me` | Authenticated | Get current authenticated user profile |
| `GET` | `/health` | Public | Health check verifying API status and uptime |
| `GET` | `/tickets` | Authenticated | List tickets (Customer: scoped to own; Agent: all tickets with filters) |
| `POST` | `/tickets` | Customer | Create ticket (`subject`, `description`, `priority`) |
| `GET` | `/tickets/:id` | Authorized | Get single ticket details (Customer: own only; Agent: any) |
| `PUT` | `/tickets/:id` | Authorized | Update status, priority, assignment (Agent) or content (Customer) |
| `DELETE` | `/tickets/:id` | Agent | Permanently delete ticket and cascaded comments |
| `GET` | `/tickets/:id/comments`| Authorized | List comments thread for ticket in chronological order |
| `POST` | `/tickets/:id/comments`| Authorized | Post comment/reply to ticket (`comment`) |
| `GET` | `/users` | Agent | List support agents available for ticket assignment |

---

## ⚙️ Environment Variables

### Root / Backend `.env.example`
```env
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=support_ticket_db
DB_CONNECTION_LIMIT=10

# Authentication (JWT)
JWT_SECRET=your_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h
```

### Frontend `.env.example`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Local Installation & Setup Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v25)
- **npm**: v9+ (tested on v11)
- **MySQL**: v8.0+

### 2. Database Initialization
```bash
# Connect to MySQL CLI
mysql -u root -p

# Execute Schema and Seed scripts
source /path/to/support-ticket-system/database/schema.sql;
source /path/to/support-ticket-system/database/seed.sql;
```

### 3. Backend Setup
```bash
cd backend
npm install

# Copy environment variables and configure DB password
cp .env.example .env

# Start Backend development server
npm run dev
# Server runs at: http://localhost:5000
```

### 4. Frontend Setup
```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env

# Start Frontend Vite development server
npm run dev
# App runs at: http://localhost:5173
```

---

## 🧪 Automated Testing & Postman Collection

### Run Master Backend Regression Suite (24 Tests)
```bash
cd backend
node test-master-regression.js
```

### Import Postman Collection
1. Open Postman.
2. Click **Import** and select `support-ticket-system/postman_collection.json`.
3. Set the collection variable `baseUrl` to `http://localhost:5000/api`.
4. Run the collection to test all 17 authentication, ticket, comment, and security scenarios.

---

## ☁️ Production Cloud Deployment Guide

### A. Database Deployment (Cloud MySQL)
1. Provision a managed MySQL database on **Aiven**, **TiDB Cloud**, **Railway**, or **Clever Cloud**.
2. Run the `database/schema.sql` and `database/seed.sql` scripts in the cloud MySQL instance.
3. Obtain the connection string (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

### B. Backend Deployment (Render / Railway)
1. Connect your GitHub repository to **Render** or **Railway**.
2. Set Root Directory to `backend`.
3. Set Build Command: `npm install`.
4. Set Start Command: `npm start` (or `node src/server.js`).
5. Configure Environment Variables in the cloud dashboard:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `DB_HOST=<cloud-mysql-host>`
   - `DB_PORT=<cloud-mysql-port>`
   - `DB_USER=<cloud-mysql-user>`
   - `DB_PASSWORD=<cloud-mysql-password>`
   - `DB_NAME=<cloud-mysql-database>`
   - `JWT_SECRET=<strong-random-secret>`
   - `CORS_ORIGIN=https://<your-frontend-domain>.vercel.app`

### C. Frontend Deployment (Vercel / Netlify / Render)
1. Connect your GitHub repository to **Vercel** or **Netlify**.
2. Set Root Directory to `frontend`.
3. Set Build Command: `npm run build`.
4. Set Output Directory: `dist`.
5. Configure Environment Variable:
   - `VITE_API_URL=https://<your-backend-domain>.onrender.com/api`

---

## 🔑 Pre-Seeded Demo Credentials

All seed accounts use password: `Password123!`

| Role | Name | Email | Default Password |
| :--- | :--- | :--- | :--- |
| **Support Agent** | Sarah Connor | `agent.sarah@supportpro.com` | `Password123!` |
| **Support Agent** | David Miller | `agent.david@supportpro.com` | `Password123!` |
| **Customer** | Alice Johnson | `alice.johnson@example.com` | `Password123!` |
| **Customer** | Bob Smith | `bob.smith@example.com` | `Password123!` |
| **Customer** | Charlie Davis | `charlie.davis@example.com` | `Password123!` |
| **Customer** | Emma Watson | `emma.watson@example.com` | `Password123!` |
