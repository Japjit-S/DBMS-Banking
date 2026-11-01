# Banking Management System — DBMS Project Roadmap

**Viva date:** 2 November 2026  
**Goal:** A simple, polished banking management application that runs locally and satisfies the DBMS requirements.

## 1. Technology Stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js + Express
- **Database:** MySQL
- **MySQL driver:** `mysql2`
- **Local URL:** `http://localhost:3000`

No React, cloud deployment, Docker, real payment integrations, or unnecessary frameworks. This is an academic demonstration, not a production banking system.

### Install

- [Node.js](https://nodejs.org/en/download)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
- [Google Antigravity](https://antigravity.google/download)

If Node.js or MySQL is already installed, skip that installation.

## 2. Application Scope

Build four main sections:

### Dashboard
- Total customers
- Total accounts
- Total account balances
- Recent transactions
- Navigation sidebar

### Customers
- Create, view, update, and delete customer records
- Search and sort customers
- Validate required fields, email format, and unique email addresses
- Prevent deletion when dependent records exist

### Accounts
- Open accounts for existing customers at existing branches
- View account number, customer, branch, account type, balance, and status
- Search and view account details
- Change account status
- Prevent closure when an account has a non-zero balance

### Transactions
- Deposit money
- Withdraw money
- Transfer money between accounts
- View transaction history
- Reject non-positive amounts and withdrawals that exceed the available balance
- Use database transactions so a failed transfer cannot leave balances inconsistent

Avoid real payment gateways, OTPs, SMS integrations, and complex authentication.

## 3. Database Design

Use these five tables as the initial design.

### `Customer`
- `customer_id` — primary key
- `name`
- `email` — unique
- `phone`
- `address`
- `date_of_birth`

### `Branch`
- `branch_id` — primary key
- `branch_name`
- `IFSC_code` — unique
- `address`

### `Account`
- `account_id` — primary key
- `customer_id` — foreign key to `Customer`
- `branch_id` — foreign key to `Branch`
- `account_number` — unique
- `account_type`
- `balance`
- `status`
- `opening_date`

### `BankTransaction`
- `transaction_id` — primary key
- `account_id` — foreign key to `Account`
- `transaction_type`
- `amount`
- `transaction_date`
- `description`

### `Transfer`
- `transfer_id` — primary key
- `from_account_id` — foreign key to `Account`
- `to_account_id` — foreign key to `Account`
- `amount`
- `transfer_date`
- `status`

### Relationships

- Customer **1:N** Account
- Branch **1:N** Account
- Account **1:N** BankTransaction
- Account **1:N** Transfer as the source account
- Account **1:N** Transfer as the destination account

For simplicity, each account belongs to one customer. Joint accounts can be added later if time permits.

### Constraints and normalization

Use:
- Primary keys and foreign keys
- `NOT NULL` constraints for required fields
- `UNIQUE` constraints for email, IFSC code, and account number
- `CHECK` constraints for valid amounts, balances, account types, and statuses where supported
- Sensible defaults and appropriate referential-integrity rules
- `DECIMAL` for monetary values, not floating-point types

Design the schema to satisfy **Third Normal Form (3NF)**. Document the relevant functional dependencies and explain why each table is in 1NF, 2NF, and 3NF. Do not merely claim that the database is normalized.

Transfers should be recorded separately from ordinary deposits and withdrawals. Use a MySQL transaction and suitable row locking when debiting and crediting accounts. If either side fails, roll back both balance changes. Prevent transfers from an account to itself.

## 4. Suggested Folder Structure

```text
banking-management-system/
├── server.js
├── db.js
├── package.json
├── .env.example
├── .gitignore
├── database/
│   ├── schema.sql
│   └── seed.sql
├── routes/
│   ├── customers.js
│   ├── accounts.js
│   ├── transactions.js
│   └── dashboard.js
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js
│       ├── customers.js
│       ├── accounts.js
│       └── transactions.js
└── docs/
    ├── ER-diagram.md
    ├── normalization.md
    └── viva-questions.md
```

Antigravity can adjust the structure slightly if doing so keeps the application simpler.

## 5. Development Roadmap

### Phase 1 — Environment and skeleton
1. Verify Node.js and MySQL are installed.
2. Initialize the Node.js project.
3. Create a minimal Express server.
4. Serve the frontend from Express.
5. Confirm the app opens at `http://localhost:3000`.

**Exit condition:** The local server starts and serves a page.

### Phase 2 — Database and ER diagram
1. Create the five tables.
2. Add keys, constraints, and relationships.
3. Insert sample data.
4. Test the schema in MySQL.
5. Create an ER diagram showing every attribute, keys, cardinality, and participation constraints.
6. Write the 3NF explanation.

**Exit condition:** Schema and seed scripts run successfully, and the design is explainable.

### Phase 3 — Backend APIs
Implement and test:
- Customer CRUD
- Account CRUD and status updates
- Deposit, withdrawal, and transfer operations
- Transaction history
- Dashboard statistics

Use parameterized SQL queries, server-side validation, suitable HTTP status codes, and environment variables for database credentials.

**Exit condition:** APIs work before the frontend is connected.

### Phase 4 — Frontend
Build:
- Sidebar and header
- Dashboard summary cards
- Searchable customer and account tables
- Add/edit forms
- Confirmation dialogs
- Transaction forms
- Success/error notifications
- Responsive styling

Connect controls to real backend APIs. Do not use hardcoded statistics or fake CRUD actions.

### Phase 5 — Integration and testing
Test:
- Creating, viewing, editing, and deleting a customer
- Opening and viewing accounts
- Invalid form inputs
- Duplicate email/account number
- Deposit and withdrawal
- Insufficient-balance rejection
- Successful transfer
- Failed transfer rollback
- Database persistence after restarting the server
- Dashboard values matching the database

Fix actual bugs and report which tests passed.

### Phase 6 — Viva preparation
Prepare:
- ER diagram
- Relational schema
- Normalization explanation with functional dependencies
- Important SQL queries
- Constraint and referential-integrity explanation
- CRUD and transaction test cases
- README with setup instructions
- Short viva Q&A notes

## 6. Master Prompt for Antigravity

Copy and paste this into a new Antigravity project conversation:

> # Project: Banking Management System
>
> Build a simple but polished DBMS college project called **Banking Management System**. This is an academic demonstration, not a production banking application.
>
> ## Technology
> - Frontend: HTML, CSS, vanilla JavaScript.
> - Backend: Node.js and Express.
> - Database: MySQL.
> - Driver: `mysql2`.
> - Run locally at `http://localhost:3000`.
> - Do not use React, TypeScript, Docker, cloud services, or unnecessary frameworks.
>
> ## Features
>
> **Dashboard:** Display customer count, account count, total account balances, recent transactions, and navigation.
>
> **Customers:** Full CRUD, searchable/sortable table, form validation, unique email addresses, and clear handling when deletion is blocked by dependent records.
>
> **Accounts:** Open accounts for existing customers and branches, view account details, search accounts, change status, and prevent closure when the balance is non-zero.
>
> **Transactions:** Support deposits, withdrawals, transfers, and transaction history. Reject non-positive amounts, insufficient-balance withdrawals, and transfers from an account to itself. Make balance changes atomic with MySQL transactions and rollback on failure.
>
> ## Database
>
> Create these tables:
>
> 1. `Customer`: customer_id, name, email, phone, address, date_of_birth.
> 2. `Branch`: branch_id, branch_name, IFSC_code, address.
> 3. `Account`: account_id, customer_id, branch_id, account_number, account_type, balance, status, opening_date.
> 4. `BankTransaction`: transaction_id, account_id, transaction_type, amount, transaction_date, description.
> 5. `Transfer`: transfer_id, from_account_id, to_account_id, amount, transfer_date, status.
>
> Required relationships:
> - Customer 1:N Account
> - Branch 1:N Account
> - Account 1:N BankTransaction
> - Account 1:N Transfer as source
> - Account 1:N Transfer as destination
>
> Use suitable primary keys, foreign keys, unique constraints, NOT NULL constraints, CHECK constraints, and defaults. Use DECIMAL for monetary values. Use restrictive foreign-key behavior where appropriate rather than cascading deletion of financial records. Design for 3NF and document the functional dependencies.
>
> Transfers must update both account balances atomically. Use a MySQL transaction and suitable row locking or equivalent concurrency protection. Roll back both changes if any step fails.
>
> ## UI
>
> Create a modern, restrained banking dashboard with a sidebar, header, summary cards, searchable tables, forms, confirmation dialogs, empty states, and success/error notifications. Use consistent spacing and typography. Do not add decorative complexity or fake functionality.
>
> ## Structure
>
> Keep database, routes, frontend assets, and documentation separated. Suggested files include `server.js`, `db.js`, `database/schema.sql`, `database/seed.sql`, route files for customers/accounts/transactions/dashboard, frontend files under `public/`, and documentation under `docs/`.
>
> ## Academic deliverables
>
> Produce a complete SQL schema and sample data; ER diagram with attributes, keys, cardinalities, and participation constraints; relational schema; 1NF/2NF/3NF explanation with functional dependencies; important SQL queries; test cases; README; and concise viva questions and answers.
>
> ## Workflow
>
> First inspect the workspace and show a short implementation plan. Then work in phases:
> 1. Environment checks and Express skeleton.
> 2. MySQL schema, seed data, ER design.
> 3. Backend CRUD APIs.
> 4. Dashboard and customer management UI.
> 5. Account management and transactions.
> 6. Integration testing, bug fixes, and documentation.
>
> After each phase, run relevant checks and report what works and what remains. Do not claim tests passed unless they were run. Keep code beginner-friendly and explain important decisions. Do not leave fake buttons or placeholder forms presented as complete. Begin with Phase 1 and show the plan before making major changes.

## 7. Sequential Follow-up Prompts

Use these one at a time, after the corresponding phase is ready.

### Prompt 1 — Database
> Implement the MySQL schema and seed data first. Verify foreign keys, uniqueness rules, participation constraints, and 3NF. Generate a readable ER diagram. Explain the relationships and test the schema before proceeding to the backend.

### Prompt 2 — Backend
> Implement the Express server and REST APIs for customer CRUD, account CRUD, transaction history, and dashboard statistics. Connect to MySQL using environment variables and parameterized queries. Run the server and test every endpoint. Fix errors before moving on.

### Prompt 3 — Frontend
> Create the responsive dashboard using vanilla HTML, CSS, and JavaScript. Connect forms, tables, search, and buttons to real backend APIs. Use realistic sample data. Do not use hardcoded statistics or fake CRUD operations.

### Prompt 4 — Final verification
> Run the application and test it end to end. Check CRUD, database persistence, invalid inputs, insufficient balances, successful transfers, and failed-transfer rollback. Fix bugs, verify the ER diagram and documentation, and provide exact startup instructions. Report which tests actually passed and which remain incomplete.

## 8. Target Timeline

| Date | Target |
|---|---|
| 28 October | Environment, schema, ER diagram |
| 29 October | Backend and CRUD APIs |
| 30 October | Frontend and account management |
| 31 October | Transactions, integration, bug fixes |
| 1 November | Documentation and viva practice |
| 2 November | Viva demonstration |

This is a target schedule, not a guarantee. Prioritize working CRUD and academic database deliverables over visual polish if time becomes tight.

## 9. Final Checklist

- [ ] Node.js and MySQL installed; application runs locally.
- [ ] ER diagram contains attributes, cardinalities, and participation constraints.
- [ ] CRUD operations work against MySQL.
- [ ] Schema is normalized to at least 3NF and constraints are justified.
- [ ] Deposits, withdrawals, and transfers work correctly.
- [ ] Invalid inputs and insufficient balances are handled.
- [ ] Sample data is ready for demonstration.
- [ ] README, SQL scripts, and viva notes are ready.
