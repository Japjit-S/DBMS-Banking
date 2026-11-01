# Banking Management System — DBMS Laboratory Project

A robust, relational banking management web application designed and built for academic evaluation, viva examination, and practical demonstration.

Built with pure vanilla web technologies, Node.js/Express, and MySQL 8.x, the system enforces strict relational database integrity, third normal form (3NF), declarative check constraints, and atomic ACID financial transfers.

---

## 1. Technology Stack

- **Frontend:** Vanilla HTML5, CSS3, modern JavaScript (ES6+). Zero heavy frameworks (no React/Vue/Angular).
- **Backend:** Node.js + Express.js.
- **Database:** MySQL Community Server 8.x (InnoDB engine).
- **Database Driver:** `mysql2/promise` with connection pooling.
- **Environment:** Configured via `dotenv`.

---

## 2. Directory Architecture

```text
D:\DBMS project\
├── database/
│   ├── schema.sql           # DDL: 5 relational tables, PKs, FKs, CHECK constraints
│   └── seed.sql             # DML: Realistic seed records (5 branches, 8 customers, 9 accounts, etc.)
├── routes/
│   ├── branches.js          # GET /api/branches
│   ├── customers.js         # Customer CRUD & dependent account safeguards
│   ├── accounts.js          # Account listing with JOINs, opening transactions, closure rule
│   ├── transactions.js      # Atomic deposits, withdrawals, ACID transfer engine, history
│   └── dashboard.js         # KPI metrics & recent activity
├── public/
│   ├── index.html           # Single-page banking dashboard UI
│   ├── css/
│   │   └── styles.css       # Clean, modern banking UI design
│   └── js/
│       ├── api.js           # Centralized asynchronous fetch client
│       ├── app.js           # Master UI orchestration, navigation, modals, toasts
│       ├── customers.js     # Customer management UI logic
│       ├── accounts.js      # Account portfolio UI logic
│       └── transactions.js  # Transaction & transfer UI logic
├── test/
│   └── test-integration.js  # End-to-end automated test suite
├── db.js                    # MySQL2 connection pool configuration
├── server.js                # Express application entry point
├── package.json             # NPM dependencies and test script
├── .env.example             # Database credentials template
└── PROJECT_MASTER.md        # Central execution log and phase tracker
```

---

## 3. Key DBMS Features & Principles

### A. Third Normal Form (3NF) Schema Design
All 5 tables (`Branch`, `Customer`, `Account`, `BankTransaction`, `Transfer`) satisfy 3NF:
- **1NF:** All attributes contain atomic, scalar values; every table possesses a primary key.
- **2NF:** All non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies).
- **3NF:** No non-key attribute is transitively dependent on the primary key (e.g., branch address belongs strictly in `Branch`, not in `Account`).

### B. Core ACID Transfer Engine
Inter-account transfers are executed with strict atomicity and isolation:
```javascript
await connection.beginTransaction();
// Lock both accounts deterministically in ascending ID order to prevent deadlocks
const [firstId, secondId] = fromId < toId ? [fromId, toId] : [toId, fromId];
const [accounts] = await connection.query(
  'SELECT account_id, balance, status FROM Account WHERE account_id IN (?, ?) ORDER BY account_id ASC FOR UPDATE',
  [firstId, secondId]
);
// Validate balances and status...
await connection.query('UPDATE Account SET balance = balance - ? WHERE account_id = ?', [amount, fromId]);
await connection.query('UPDATE Account SET balance = balance + ? WHERE account_id = ?', [amount, toId]);
await connection.query('INSERT INTO Transfer (...) VALUES (...)');
await connection.commit();
```
If sender balance is insufficient, accounts are not active, or any query fails, `connection.rollback()` is immediately executed—guaranteeing zero partial debits.

### C. Referential Integrity & Deletion Rules
- **Ledger Integrity:** Foreign keys on financial tables (`Account`, `BankTransaction`, `Transfer`) enforce `ON DELETE RESTRICT ON UPDATE CASCADE`.
- **Customer Deletion Safeguard:** A customer with existing associated accounts cannot be deleted until all accounts are closed and removed.

### D. Account Soft Deletion & Closure Policy
- Accounts transition between `'Active'` and `'Closed'` states.
- **Business Rule:** An account can **only** be closed if its balance is exactly **₹0.00**. Any closure attempt with a positive balance is rejected by the backend.

### E. Monetary Precision & Declarative Constraints
- All balances and transaction amounts use `DECIMAL(12, 2)` to eliminate IEEE 754 floating-point inaccuracies.
- Named SQL `CHECK` constraints enforce:
  * `Account: CHECK (account_type IN ('Savings', 'Current'))`
  * `Account: CHECK (status IN ('Active', 'Closed'))`
  * `Account: CHECK (balance >= 0.00)`
  * `BankTransaction: CHECK (transaction_type IN ('Deposit', 'Withdrawal'))`
  * `BankTransaction: CHECK (amount > 0.00)`
  * `Transfer: CHECK (amount > 0.00)`
  * `Transfer: CHECK (status IN ('Completed', 'Failed', 'Pending'))`
  * `Transfer: CHECK (from_account_id <> to_account_id)`

---

## 4. Prerequisites

1. **Node.js:** v18.x, v20.x, or v24.x ([Download Node.js](https://nodejs.org/)).
2. **MySQL Server:** Community Server 8.x ([Download MySQL](https://dev.mysql.com/downloads/mysql/)).
3. **Git:** Command-line Git installed.

---

## 5. Step-by-Step Setup Guide

### Step 1: Database Setup & Seeding
Start your local MySQL server service, open terminal/PowerShell, and execute:
```bash
# Log into MySQL and run schema DDL
mysql -u root -p < database/schema.sql

# Seed the database with realistic sample records
mysql -u root -p < database/seed.sql
```
*Alternatively, you can open and execute both scripts in MySQL Workbench or phpMyAdmin.*

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and enter your MySQL credentials:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=banking_management_system
DB_PORT=3306
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Start the Server
```bash
npm start
```
*For live auto-reloading during development, run `npm run dev`.*

Open your web browser and navigate to:
```text
http://localhost:3000
```

### Step 5: Run Automated Integration Tests
The project includes a comprehensive, 40-assertion integration test suite covering customer CRUD, foreign key restrictions, duplicate handling, account operations, soft deletes, deposit/withdrawal validation, and atomic transfer rollback safety:
```bash
npm test
```

---

## 6. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/dashboard/stats` | KPI counters (`customers`, `accounts`, `balance`) and recent activity |
| `GET` | `/api/branches` | List all bank branches for dropdowns |
| `GET` | `/api/customers` | Search and list customers (`?search=`) |
| `GET` | `/api/customers/:id` | Customer details and associated accounts |
| `POST` | `/api/customers` | Register customer (unique email validated) |
| `PUT` | `/api/customers/:id` | Update customer profile |
| `DELETE` | `/api/customers/:id` | Delete customer (blocked if accounts exist) |
| `GET` | `/api/accounts` | List accounts with JOINs (`?status=`, `?search=`) |
| `GET` | `/api/accounts/:id` | Single account details |
| `POST` | `/api/accounts` | Open account (atomic opening deposit) |
| `PATCH` | `/api/accounts/:id/status` | Change status (`Active`/`Closed`; ₹0.00 rule) |
| `POST` | `/api/transactions/deposit` | Atomic deposit funds |
| `POST` | `/api/transactions/withdraw` | Atomic withdraw funds (balance checked) |
| `POST` | `/api/transactions/transfer` | ACID fund transfer with row locking |
| `GET` | `/api/transactions/history` | Chronological ledger of transactions and transfers |

---

## 7. Author & Academic Context

- **Author:** Japjit Singh
- **Target Evaluation:** College DBMS Laboratory Final Examination (2 November 2026)
- **Repository:** [https://github.com/Japjit-S/DBMS-Banking.git](https://github.com/Japjit-S/DBMS-Banking.git)
