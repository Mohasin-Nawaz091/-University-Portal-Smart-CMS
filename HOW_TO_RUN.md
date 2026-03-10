# 🎓 UniSmart Complaint Management System — How to Run

This document explains how to set up and run the project from scratch on your local machine.

---

## 📋 Prerequisites

Make sure you have the following installed before proceeding:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or higher | https://nodejs.org |
| **MySQL** | v8.0 or higher | https://dev.mysql.com/downloads/mysql/ |
| **npm** | Comes with Node.js | — |

> ✅ To verify installation, open a terminal and run:
> ```bash
> node -v
> npm -v
> mysql --version
> ```

---

## ⚙️ Step 1 — Set Up MySQL

1. Open **MySQL Workbench** or a MySQL terminal session.
2. Make sure your MySQL server is **running** on port `3306`.
3. The database (`university_complaint_system`) and all tables are **created automatically** when the server starts — you do not need to create them manually.

> ⚠️ **Important:** The project connects to MySQL using these credentials (defined in `backend/db.js`):
> ```
> Host:     localhost
> Port:     3306
> User:     root
> Password: 12345678
> ```
> If your MySQL root password is different, open `backend/db.js` and update the `password` field on **line 7**.

---

## 📦 Step 2 — Install Node.js Dependencies

1. Open a terminal (PowerShell or Command Prompt).
2. Navigate to the `backend` folder:

```bash
cd "c:\Users\user\Desktop\meherDB proj\backend"
```

3. Install all required packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- `express` — web server framework
- `mysql2` — database driver
- `bcrypt` — password hashing
- `jsonwebtoken` — authentication tokens
- `cors` — cross-origin support
- `multer` — file uploads
- `dotenv` — environment variable support

---

## 🚀 Step 3 — Start the Backend Server

While still inside the `backend` folder, run:

```bash
node server.js
```

You should see output similar to:

```
Database ensured
Tables and initial data ensured
Server running on http://localhost:3000
```

> ✅ The server is now running on **http://localhost:3000**

---

## 🌐 Step 4 — Open the Frontend

The backend also serves the frontend HTML files as static files.

Open your browser and go to:

```
http://localhost:3000/index.html
```

Or navigate to any page directly, for example:

| Page | URL |
|------|-----|
| Home / Landing | http://localhost:3000/index.html |
| Login | http://localhost:3000/login.html |
| Register | http://localhost:3000/register.html |
| Student Dashboard | http://localhost:3000/student_dashboard.html |
| Admin Panel | http://localhost:3000/admin.html |
| Department Admin | http://localhost:3000/department_admin.html |

---

## 🔑 Step 5 — Log In with Default Credentials

The system is automatically seeded with default accounts on first run. Use any of the following to log in:

### 👤 System Administrator
| Field | Value |
|-------|-------|
| Email | `admin@university.edu` |
| Password | `password123` |
| Role | Admin |

### 🏢 Department Admins
| Department | Email | Password |
|-----------|-------|---------|
| IT Department | `it_admin@university.edu` | `password123` |
| Hostel Management | `hostel_admin@university.edu` | `password123` |
| Discipline Committee | `discipline_admin@university.edu` | `password123` |
| Academic Department | `academic_admin@university.edu` | `password123` |
| Library | `library_admin@university.edu` | `password123` |

### 🎓 Student Accounts
Register a new student account on the **Register** page (`/register.html`) and log in using the `Student` role.

---

## 🗂️ Project Structure (Quick Overview)

```
meherDB proj/
├── backend/                  ← Node.js + Express backend
│   ├── server.js             ← Entry point (start this file)
│   ├── db.js                 ← MySQL connection + auto-setup
│   ├── routes/               ← API route handlers
│   │   ├── auth.js
│   │   ├── complaints.js
│   │   ├── admin.js
│   │   ├── department.js
│   │   └── notifications.js
│   ├── package.json          ← Dependencies list
│   └── uploads/              ← Uploaded complaint images
│
├── index.html                ← Landing/home page
├── login.html                ← Login page
├── register.html             ← Student registration
├── student_dashboard.html    ← Student dashboard
├── admin.html                ← Admin panel
├── department_admin.html     ← Department admin panel
├── view_complaints.html      ← View all complaints
├── submit_complaints.html    ← Submit a new complaint
├── credentials.txt           ← Default login credentials reference
└── HOW_TO_RUN.md             ← This file
```

---

## 🛠️ Troubleshooting

### ❌ `Error: connect ECONNREFUSED 127.0.0.1:3306`
- MySQL is not running. Start your MySQL server and try again.

### ❌ `Access denied for user 'root'@'localhost'`
- Your MySQL root password does not match the one in `backend/db.js`.
- Update the `password` field on **line 7** of `backend/db.js` to match your actual MySQL password.

### ❌ `Cannot find module '...'`
- You haven't installed dependencies yet. Run `npm install` inside the `backend/` folder.

### ❌ Port 3000 already in use
- Another process is using port 3000. Either stop it, or change the `PORT` constant on **line 41** of `backend/server.js` to another port (e.g., `3001`).

---

## 🔁 Quick Start Summary

```bash
# 1. Navigate to the backend folder
cd "c:\Users\user\Desktop\meherDB proj\backend"

# 2. Install dependencies (only needed once)
npm install

# 3. Start the server
node server.js

# 4. Open in browser
# Go to: http://localhost:3000/index.html
```

---

*Last updated: March 2026*
