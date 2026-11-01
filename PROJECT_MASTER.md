# Banking Management System — Master Project Tracker

**Project:** College DBMS Laboratory Project  
**Target Viva Date:** 2 November 2026  
**Architecture:** Vanilla HTML/CSS/JS + Node.js (Express) + MySQL (`mysql2`)  
**Base URL:** `http://localhost:3000`  
**Master Chat Role:** Central tracking, planning, record-keeping, and coordination.  

---

## 1. System Environment Status

| Component | Status | Details / Version |
|---|---|---|
| **OS** | Ready | Windows (HP Omen 16) |
| **Node.js** | Verified | `v24.13.0` |
| **npm** | Verified | `11.6.2` |
| **MySQL Server** | Pending Setup | Not detected in system `PATH` |
| **Git Remote** | Configured | `https://github.com/Japjit-S/DBMS-Banking.git` (Branch: `main`) |
| **Project Root** | Ready | `D:\DBMS project` |

---

## 2. Directory Architecture

```text
D:\DBMS project\
├── PROJECT_MASTER.md                  # Central execution log and master record
├── banking_management_system_roadmap.md# Original roadmap specification
├── package.json                       # Node dependencies and scripts
├── .env.example                       # DB credentials template
├── .gitignore                         # Git exclusion rules
├── server.js                          # Express application entry point
├── db.js                              # MySQL connection pool configuration
├── database/
│   ├── schema.sql                     # DDL: 5 tables, constraints, FKs
│   ├── seed.sql                       # DML: Realistic sample records
│   └── queries.sql                    # Key queries for viva and validation
├── routes/
│   ├── dashboard.js                   # KPI stats and recent activity API
│   ├── customers.js                   # Customer CRUD API
│   ├── accounts.js                    # Account CRUD and status management API
│   └── transactions.js                # Deposit, withdraw, transfer API
├── public/
│   ├── index.html                     # Single-page dashboard interface
│   ├── css/
│   │   └── styles.css                 # Clean, restrained banking styles
│   └── js/
│       ├── api.js                     # Unified fetch client
│       ├── app.js                     # Dashboard view orchestration
│       ├── customers.js               # Customer UI logic
│       ├── accounts.js                # Account UI logic
│       └── transactions.js            # Transaction & transfer UI logic
└── docs/
    ├── ER-diagram.md                  # Mermaid ER diagram & constraints
    ├── normalization.md               # 1NF, 2NF, 3NF mathematical justification
    └── viva-questions.md              # Rapid Q&A sheet for evaluation
```

---

## 3. Master Phase Progression & Work Distribution (UI-First Approach)

| Phase | Description | Execution Channel | Status | Completion Target |
|---|---|---|---|---|
| **Phase 0** | Workspace & Tracker Initialization | Master Chat | **DONE** | 28 Oct 2026 |
| **Phase 1 (UI-First)** | Frontend Prototype & Mock UI (Dashboard, Customers, Accounts, Transactions) | Dedicated Sub-Chat (Chat 1) | **DONE** | 28 Oct 2026 |
| **Phase 2** | MySQL Schema & Seed Data (`schema.sql`, `seed.sql`) | Dedicated Sub-Chat (Chat 2) | **DONE** | 02 Nov 2026 |
| **Phase 3** | Express Skeleton, Connection Pool & REST CRUD APIs | Dedicated Sub-Chat (Chat 2) | **DONE** | 02 Nov 2026 |
| **Phase 4** | Frontend-to-Backend Integration & Live API Wiring | Dedicated Sub-Chat (Chat 2) | **DONE** | 02 Nov 2026 |
| **Phase 5** | End-to-End Testing (Rollback Safety, Edge Cases, Verification) | Dedicated Sub-Chat (Chat 2) | **DONE** | 02 Nov 2026 |

---

## 4. Multi-Chat Protocol

1. **Master Chat (This Conversation):**
   - Coordinates overarching schedule, records changes, logs technical decisions.
   - Formulates precise prompts and boundaries for each sub-chat.
   - Verifies exit criteria and updates `PROJECT_MASTER.md`.

2. **Specialized Sub-Chats:**
   - Run specific phases without context drift.
   - Summarize file changes and verification status upon completion.
   - Hand back results to Master Chat before moving to the next phase.

---

## 5. Technical Decision & Constraints Log

- **Development Sequence Change (UI-First):** Decided on 28 Oct 2026 to prototype the complete frontend first to visually validate all data attributes, user journeys, form inputs, modal dialogs, and table structures before implementing schema and backend APIs.
- **Monetary Precision:** `DECIMAL(12, 2)` utilized across all financial attributes (`balance`, `amount`).
- **Transfer Concurrency & Atomicity:** Strict MySQL ACID transactions (`START TRANSACTION`, `SELECT ... FOR UPDATE`, `COMMIT`, `ROLLBACK`) ensuring zero partial debits.
- **Normal Form Target:** 3NF strictly verified. Functional dependencies explicitly documented for viva defense.
- **Dependency Deletion Rules:** Restrictive FK constraints (`ON DELETE RESTRICT`) to prevent accidental deletion of customers or accounts with active history.
- **Account Types Restriction (Logged 28 Oct 2026):** Scope strictly limited to `Savings` and `Current`. Enforced via SQL check constraint `CHECK (account_type IN ('Savings', 'Current'))`. Business accounts or multi-user joint accounts are omitted to keep the academic demonstration focused and reliable.
- **Account Lifecycle & Soft Delete (Logged 2 Nov 2026):** Accounts strictly use soft deletion (`status` restricted to `'Active'` and `'Closed'`). The `'Frozen'` state is eliminated. Accounts with ₹0 balance transition to `'Closed'` without hard-deleting the row, ensuring historical audit trails in `BankTransaction` and `Transfer` remain referentially intact under foreign key constraints.
- **Team Work Distribution (Logged 2 Nov 2026):** Phase 2 scope for this system is focused strictly on the production SQL scripts (`database/schema.sql` and `database/seed.sql`). Queries demonstration script (`database/queries.sql`) and academic reports (`docs/ER-diagram.md`, `docs/normalization.md`) are delegated to teammate's deliverable scope.
- **Phase 1 UI-First Prototype (Completed 28 Oct 2026):** Implemented standalone, zero-dependency browser prototype under `public/` (`index.html`, `css/styles.css`, `js/mockData.js`, `js/customers.js`, `js/accounts.js`, `js/transactions.js`, `js/app.js`). Simulates full relational business rules and constraints directly in client state with real-time DOM synchronization and toast notifications. Verified headlessly and in default browser.

---

## 6. Mandatory Git Verification & Push Protocol

1. **Task Completion Notification:** Whenever a phase or milestone task completes, the agent MUST present a verification report directly in this Master Chat detailing:
   - Modified and created files.
   - Test results and verification against exit criteria.
   - Any deviations or observations.
2. **Strict Awaiting of Confirmation:** The agent will NEVER push commits to the remote Git repository automatically.
3. **Push on Explicit Order Only:** Git commits and pushes to `origin main` will strictly occur ONLY after Master provides explicit confirmation (e.g., "Confirmed, push to Git" or "Push").
