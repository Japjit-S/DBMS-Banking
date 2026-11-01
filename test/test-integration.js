/**
 * Banking Management System - End-to-End & Integration Test Suite
 * Tests live server routes, database constraints, ACID transactions, and rollback safety.
 */

const http = require('http');
const app = require('../server');
const db = require('../db');

// ANSI Colors for clean terminal reporting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${GREEN}✓${RESET} ${message}`);
  } else {
    failedTests++;
    console.error(`  ${RED}✗ FAIL:${RESET} ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * In-memory relational database mock for standalone execution
 * when local MySQL server service is offline / pending setup.
 */
function setupInMemoryAdapter(pool) {
  const seedBranches = [
    { branch_id: 1, branch_name: 'Hyderabad Main Branch', IFSC_code: 'SBIN0001234', address: 'Road No 12, Banjara Hills, Hyderabad, Telangana' },
    { branch_id: 2, branch_name: 'Hitec City Tech Branch', IFSC_code: 'HDFC0004567', address: 'Cyber Towers Quad, Madhapur, Hyderabad, Telangana' },
    { branch_id: 3, branch_name: 'Bangalore Central Branch', IFSC_code: 'ICIC0007890', address: '100ft Road, Indiranagar, Bengaluru, Karnataka' },
    { branch_id: 4, branch_name: 'Mumbai Nariman Point Branch', IFSC_code: 'KKBK0002468', address: 'Maker Chambers, Nariman Point, Mumbai, Maharashtra' },
    { branch_id: 5, branch_name: 'New Delhi Connaught Place', IFSC_code: 'PUNB0001357', address: 'Inner Circle, Connaught Place, New Delhi' }
  ];

  const seedCustomers = [
    { customer_id: 1, name: 'Rajesh Sharma', email: 'rajesh.sharma@example.com', phone: '+91 98765 43210', address: 'Plot 42, Jubilee Hills, Hyderabad', date_of_birth: '1988-04-12' },
    { customer_id: 2, name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 98234 56789', address: 'Flat 302, Palm Heights, Bengaluru', date_of_birth: '1992-09-25' },
    { customer_id: 3, name: 'Japjit Singh', email: 'japjit.singh@example.com', phone: '+91 99887 76655', address: 'B-12 Defence Colony, New Delhi', date_of_birth: '2003-06-15' },
    { customer_id: 4, name: 'Ananya Sen', email: 'ananya.sen@example.com', phone: '+91 97112 34567', address: '14 Ballygunge Circular Rd, Kolkata', date_of_birth: '1995-11-03' },
    { customer_id: 5, name: 'Rohan Verma', email: 'rohan.verma@example.com', phone: '+91 98450 12345', address: '5th Main, Koramangala, Bengaluru', date_of_birth: '1990-01-20' },
    { customer_id: 6, name: 'Sneha Reddy', email: 'sneha.reddy@example.com', phone: '+91 96321 85296', address: 'Street 3, Gachibowli, Hyderabad', date_of_birth: '1998-07-14' },
    { customer_id: 7, name: 'Vikram Malhotra', email: 'vikram.malhotra@example.com', phone: '+91 98111 22334', address: 'C-8 Marine Drive, Mumbai', date_of_birth: '1985-12-08' },
    { customer_id: 8, name: 'Kavita Iyer', email: 'kavita.iyer@example.com', phone: '+91 94440 98765', address: 'T-Nagar 4th Street, Chennai', date_of_birth: '1994-03-30' }
  ];

  const seedAccounts = [
    { account_id: 1, customer_id: 1, branch_id: 1, account_number: 'ACC-1001001', account_type: 'Savings', balance: 145000.00, status: 'Active', opening_date: '2025-01-15' },
    { account_id: 2, customer_id: 1, branch_id: 2, account_number: 'ACC-1001002', account_type: 'Current', balance: 520000.00, status: 'Active', opening_date: '2025-02-01' },
    { account_id: 3, customer_id: 2, branch_id: 3, account_number: 'ACC-1001003', account_type: 'Savings', balance: 89450.50, status: 'Active', opening_date: '2025-02-20' },
    { account_id: 4, customer_id: 3, branch_id: 5, account_number: 'ACC-1001004', account_type: 'Savings', balance: 312000.00, status: 'Active', opening_date: '2025-03-05' },
    { account_id: 5, customer_id: 4, branch_id: 1, account_number: 'ACC-1001005', account_type: 'Savings', balance: 45200.00, status: 'Active', opening_date: '2025-03-25' },
    { account_id: 6, customer_id: 5, branch_id: 3, account_number: 'ACC-1001006', account_type: 'Current', balance: 18500.00, status: 'Active', opening_date: '2025-04-10' },
    { account_id: 7, customer_id: 6, branch_id: 2, account_number: 'ACC-1001007', account_type: 'Savings', balance: 234000.00, status: 'Active', opening_date: '2025-05-15' },
    { account_id: 8, customer_id: 7, branch_id: 4, account_number: 'ACC-1001008', account_type: 'Current', balance: 890000.00, status: 'Active', opening_date: '2025-06-05' },
    { account_id: 9, customer_id: 8, branch_id: 1, account_number: 'ACC-1001009', account_type: 'Savings', balance: 0.00, status: 'Closed', opening_date: '2025-07-20' }
  ];

  const seedTransactions = [
    { transaction_id: 1, account_id: 1, transaction_type: 'Deposit', amount: 50000.00, transaction_date: '2026-10-20 10:15:00', description: 'Initial branch cash deposit' },
    { transaction_id: 2, account_id: 2, transaction_type: 'Deposit', amount: 200000.00, transaction_date: '2026-10-21 11:30:00', description: 'Vendor payment invoice #904' },
    { transaction_id: 3, account_id: 4, transaction_type: 'Deposit', amount: 75000.00, transaction_date: '2026-10-22 09:45:00', description: 'Consultancy honorarium credit' },
    { transaction_id: 4, account_id: 1, transaction_type: 'Withdrawal', amount: 15000.00, transaction_date: '2026-10-23 14:20:00', description: 'ATM Cash Withdrawal' },
    { transaction_id: 5, account_id: 3, transaction_type: 'Deposit', amount: 30000.00, transaction_date: '2026-10-24 16:00:00', description: 'Monthly salary dividend' },
    { transaction_id: 6, account_id: 7, transaction_type: 'Deposit', amount: 100000.00, transaction_date: '2026-10-25 13:10:00', description: 'Term deposit maturity credit' },
    { transaction_id: 7, account_id: 4, transaction_type: 'Withdrawal', amount: 25000.00, transaction_date: '2026-10-26 17:40:00', description: 'Hardware equipment expense' },
    { transaction_id: 8, account_id: 8, transaction_type: 'Deposit', amount: 250000.00, transaction_date: '2026-10-27 10:05:00', description: 'Commercial contract disbursement' }
  ];

  const seedTransfers = [
    { transfer_id: 1, from_account_id: 2, to_account_id: 1, amount: 25000.00, transfer_date: '2026-10-26 11:00:00', status: 'Completed', description: 'Inter-account personal reserve rebalance' },
    { transfer_id: 2, from_account_id: 4, to_account_id: 3, amount: 12000.00, transfer_date: '2026-10-27 14:30:00', status: 'Completed', description: 'DBMS research lab fee settlement' }
  ];

  const store = {
    branches: JSON.parse(JSON.stringify(seedBranches)),
    customers: JSON.parse(JSON.stringify(seedCustomers)),
    accounts: JSON.parse(JSON.stringify(seedAccounts)),
    transactions: JSON.parse(JSON.stringify(seedTransactions)),
    transfers: JSON.parse(JSON.stringify(seedTransfers))
  };

  function executeQuery(sql, params = []) {
    const s = sql.replace(/\s+/g, ' ').trim();

    // 1. Branches
    if (s.startsWith('SELECT branch_id, branch_name, IFSC_code, address FROM Branch')) {
      return [JSON.parse(JSON.stringify(store.branches))];
    }

    // 2. Customers
    if (s.includes('FROM Customer') && s.includes('COUNT(*) AS total_customers')) {
      return [[{ total_customers: store.customers.length }]];
    }

    if (s.startsWith('SELECT customer_id, name, email, phone, address, date_of_birth FROM Customer WHERE customer_id = ?')) {
      const cust = store.customers.find(c => c.customer_id === Number(params[0]));
      return [cust ? [JSON.parse(JSON.stringify(cust))] : []];
    }

    if (s.startsWith('SELECT customer_id, name FROM Customer WHERE customer_id = ?')) {
      const cust = store.customers.find(c => c.customer_id === Number(params[0]));
      return [cust ? [{ customer_id: cust.customer_id, name: cust.name }] : []];
    }

    if (s.startsWith('SELECT customer_id FROM Customer WHERE customer_id = ?')) {
      const cust = store.customers.find(c => c.customer_id === Number(params[0]));
      return [cust ? [{ customer_id: cust.customer_id }] : []];
    }

    if (s.includes('FROM Customer WHERE name LIKE ? OR email LIKE ?')) {
      const q = String(params[0]).replace(/%/g, '').toLowerCase();
      const list = store.customers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
      return [JSON.parse(JSON.stringify(list))];
    }

    if (s.startsWith('SELECT customer_id, name, email, phone, address, date_of_birth FROM Customer')) {
      return [JSON.parse(JSON.stringify(store.customers))];
    }

    if (s.startsWith('INSERT INTO Customer')) {
      const [name, email, phone, address, dob] = params;
      if (store.customers.some(c => c.email.toLowerCase() === email.toLowerCase())) {
        const err = new Error("Duplicate entry '" + email + "' for key 'Customer.uq_customer_email'");
        err.code = 'ER_DUP_ENTRY';
        throw err;
      }
      const newId = store.customers.length > 0 ? Math.max(...store.customers.map(c => c.customer_id)) + 1 : 1;
      const record = { customer_id: newId, name, email, phone, address, date_of_birth: dob };
      store.customers.push(record);
      return [{ insertId: newId, affectedRows: 1 }];
    }

    if (s.startsWith('UPDATE Customer')) {
      const [name, email, phone, address, dob, customerId] = params;
      const cust = store.customers.find(c => c.customer_id === Number(customerId));
      if (!cust) return [{ affectedRows: 0 }];
      const duplicate = store.customers.find(c => c.customer_id !== Number(customerId) && c.email.toLowerCase() === email.toLowerCase());
      if (duplicate) {
        const err = new Error("Duplicate entry '" + email + "' for key 'Customer.uq_customer_email'");
        err.code = 'ER_DUP_ENTRY';
        throw err;
      }
      cust.name = name;
      cust.email = email;
      cust.phone = phone;
      cust.address = address;
      cust.date_of_birth = dob;
      return [{ affectedRows: 1 }];
    }

    if (s.startsWith('DELETE FROM Customer WHERE customer_id = ?')) {
      const id = Number(params[0]);
      store.customers = store.customers.filter(c => c.customer_id !== id);
      return [{ affectedRows: 1 }];
    }

    // 3. Accounts
    if (s.includes('COUNT(*) AS count FROM Account WHERE customer_id = ?')) {
      const count = store.accounts.filter(a => a.customer_id === Number(params[0])).length;
      return [[{ count }]];
    }

    if (s.includes('COUNT(*) AS total_accounts') && s.includes('total_balance')) {
      const totalAccounts = store.accounts.length;
      const totalBalance = store.accounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
      return [[{ total_accounts: totalAccounts, total_balance: totalBalance }]];
    }

    if (s.startsWith('SELECT branch_id FROM Branch WHERE branch_id = ?')) {
      const b = store.branches.find(br => br.branch_id === Number(params[0]));
      return [b ? [{ branch_id: b.branch_id }] : []];
    }

    if (s.startsWith('SELECT MAX(account_id) AS maxId FROM Account')) {
      const maxId = store.accounts.length > 0 ? Math.max(...store.accounts.map(a => a.account_id)) : 0;
      return [[{ maxId }]];
    }

    if (s.startsWith('SELECT a.account_id, a.account_number, a.account_type, a.balance, a.status, a.opening_date, b.branch_id, b.branch_name, b.IFSC_code FROM Account a JOIN Branch b ON a.branch_id = b.branch_id WHERE a.customer_id = ?')) {
      const custId = Number(params[0]);
      const rows = store.accounts.filter(a => a.customer_id === custId).map(a => {
        const br = store.branches.find(b => b.branch_id === a.branch_id) || {};
        return {
          ...a,
          branch_id: br.branch_id,
          branch_name: br.branch_name,
          IFSC_code: br.IFSC_code
        };
      });
      return [rows];
    }

    if (s.includes('FROM Account a') && s.includes('WHERE a.account_id = ?')) {
      const accId = Number(params[0]);
      const acc = store.accounts.find(a => a.account_id === accId);
      if (!acc) return [[]];
      const cust = store.customers.find(c => c.customer_id === acc.customer_id) || {};
      const br = store.branches.find(b => b.branch_id === acc.branch_id) || {};
      return [[{
        ...acc,
        customer_name: cust.name,
        customer_email: cust.email,
        customer_phone: cust.phone,
        branch_name: br.branch_name,
        IFSC_code: br.IFSC_code,
        branch_address: br.address
      }]];
    }

    if (s.includes('FROM Account a') && s.includes('JOIN Customer c') && s.includes('JOIN Branch b')) {
      let rows = store.accounts.map(a => {
        const cust = store.customers.find(c => c.customer_id === a.customer_id) || {};
        const br = store.branches.find(b => b.branch_id === a.branch_id) || {};
        return {
          ...a,
          customer_name: cust.name,
          customer_email: cust.email,
          branch_name: br.branch_name,
          IFSC_code: br.IFSC_code
        };
      });
      if (s.includes('a.status = ?')) {
        const statusVal = params[0];
        rows = rows.filter(r => r.status === statusVal);
      }
      return [rows];
    }

    if (s.startsWith('INSERT INTO Account')) {
      const [custId, brId, accNum, accType, balance] = params;
      const newId = store.accounts.length > 0 ? Math.max(...store.accounts.map(a => a.account_id)) + 1 : 1;
      const acc = {
        account_id: newId,
        customer_id: Number(custId),
        branch_id: Number(brId),
        account_number: accNum,
        account_type: accType,
        balance: parseFloat(balance),
        status: 'Active',
        opening_date: new Date().toISOString().split('T')[0]
      };
      store.accounts.push(acc);
      return [{ insertId: newId, affectedRows: 1 }];
    }

    if (s.startsWith('SELECT account_id, account_number, balance, status FROM Account WHERE account_id = ?')) {
      const acc = store.accounts.find(a => a.account_id === Number(params[0]));
      return [acc ? [JSON.parse(JSON.stringify(acc))] : []];
    }

    if (s.startsWith('UPDATE Account SET status = ? WHERE account_id = ?')) {
      const [status, accId] = params;
      const acc = store.accounts.find(a => a.account_id === Number(accId));
      if (acc) acc.status = status;
      return [{ affectedRows: 1 }];
    }

    // 4. Transactions & Transfers
    if (s.includes('FROM Account WHERE account_id IN (?, ?)')) {
      const id1 = Number(params[0]);
      const id2 = Number(params[1]);
      const found = store.accounts.filter(a => a.account_id === id1 || a.account_id === id2)
        .sort((a, b) => a.account_id - b.account_id);
      return [JSON.parse(JSON.stringify(found))];
    }

    if (s.startsWith('UPDATE Account SET balance = balance + ? WHERE account_id = ?')) {
      const [amt, accId] = params;
      const acc = store.accounts.find(a => a.account_id === Number(accId));
      if (acc) acc.balance = Math.round((parseFloat(acc.balance) + parseFloat(amt)) * 100) / 100;
      return [{ affectedRows: 1 }];
    }

    if (s.startsWith('UPDATE Account SET balance = balance - ? WHERE account_id = ?')) {
      const [amt, accId] = params;
      const acc = store.accounts.find(a => a.account_id === Number(accId));
      if (acc) acc.balance = Math.round((parseFloat(acc.balance) - parseFloat(amt)) * 100) / 100;
      return [{ affectedRows: 1 }];
    }

    if (s.startsWith('INSERT INTO BankTransaction')) {
      const [accId, type, amt, desc] = params;
      const newId = store.transactions.length > 0 ? Math.max(...store.transactions.map(t => t.transaction_id)) + 1 : 1;
      const record = {
        transaction_id: newId,
        account_id: Number(accId),
        transaction_type: type,
        amount: parseFloat(amt),
        transaction_date: new Date().toISOString(),
        description: desc
      };
      store.transactions.push(record);
      return [{ insertId: newId, affectedRows: 1 }];
    }

    if (s.startsWith('INSERT INTO Transfer')) {
      const [fromId, toId, amt, desc] = params;
      const newId = store.transfers.length > 0 ? Math.max(...store.transfers.map(t => t.transfer_id)) + 1 : 1;
      const record = {
        transfer_id: newId,
        from_account_id: Number(fromId),
        to_account_id: Number(toId),
        amount: parseFloat(amt),
        transfer_date: new Date().toISOString(),
        status: 'Completed',
        description: desc
      };
      store.transfers.push(record);
      return [{ insertId: newId, affectedRows: 1 }];
    }

    // Combined History / Dashboard recent
    if (s.includes('BankTransaction') && s.includes('UNION ALL') && s.includes('Transfer')) {
      const recentTxns = store.transactions.map(t => {
        const acc = store.accounts.find(a => a.account_id === t.account_id);
        return {
          record_type: 'Transaction',
          id: t.transaction_id,
          type: t.transaction_type,
          account_id: t.account_id,
          account_number: acc ? acc.account_number : `Acc #${t.account_id}`,
          amount: t.amount,
          timestamp: t.transaction_date,
          status: 'Completed',
          description: t.description
        };
      });

      const recentTransfers = store.transfers.map(tr => {
        const aFrom = store.accounts.find(a => a.account_id === tr.from_account_id);
        const aTo = store.accounts.find(a => a.account_id === tr.to_account_id);
        return {
          record_type: 'Transfer',
          id: tr.transfer_id,
          type: 'Transfer',
          account_id: tr.from_account_id,
          account_number: `${aFrom ? aFrom.account_number : tr.from_account_id} ➔ ${aTo ? aTo.account_number : tr.to_account_id}`,
          amount: tr.amount,
          timestamp: tr.transfer_date,
          status: tr.status,
          description: tr.description
        };
      });

      const combined = [...recentTxns, ...recentTransfers]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const limit = params.length > 0 ? Number(params[params.length - 1]) : 50;
      return [combined.slice(0, limit)];
    }

    return [[]];
  }

  // Intercept pool query and connection methods
  pool.query = async (sql, params = []) => {
    return executeQuery(sql, params);
  };

  pool.getConnection = async () => {
    let snapshot = null;
    return {
      query: async (sql, params = []) => executeQuery(sql, params),
      beginTransaction: async () => {
        snapshot = JSON.parse(JSON.stringify(store));
      },
      commit: async () => {
        snapshot = null;
      },
      rollback: async () => {
        if (snapshot) {
          store.branches = snapshot.branches;
          store.customers = snapshot.customers;
          store.accounts = snapshot.accounts;
          store.transactions = snapshot.transactions;
          store.transfers = snapshot.transfers;
          snapshot = null;
        }
      },
      release: () => {}
    };
  };
}

/**
 * Robust in-process and HTTP request executor
 */
function makeRequest(serverUrl, method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const [pathname, queryString] = urlPath.split('?');
    const query = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((val, key) => { query[key] = val; });
    }

    const req = {
      method: method.toUpperCase(),
      url: urlPath,
      originalUrl: urlPath,
      path: pathname,
      query,
      headers: {
        'content-type': 'application/json'
      },
      body: body || {},
      params: {}
    };

    const res = {
      statusCode: 200,
      headers: {},
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(k, v) {
        this.headers[k] = v;
        return this;
      },
      json(data) {
        this.body = data;
        resolve({
          status: this.statusCode,
          json: async () => this.body,
          text: async () => JSON.stringify(this.body)
        });
        return this;
      },
      send(data) {
        this.body = data;
        let parsed = data;
        try {
          if (typeof data === 'string') parsed = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: this.statusCode,
          json: async () => parsed,
          text: async () => String(data)
        });
        return this;
      },
      end(data) {
        let parsed = data;
        try {
          if (data && typeof data === 'string') parsed = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: this.statusCode,
          json: async () => parsed || {},
          text: async () => String(data || '')
        });
      }
    };

    // Route through Express app
    app(req, res, (err) => {
      if (err) {
        resolve({
          status: 500,
          json: async () => ({ success: false, message: err.message }),
          text: async () => err.message
        });
      }
    });
  });
}

/**
 * Main Test Runner
 */
async function runIntegrationTests() {
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   Banking Management System — End-to-End Integration Suite   ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  // Detect MySQL Live status
  const isLiveMySQL = await db.testConnection();
  if (isLiveMySQL) {
    console.log(`${GREEN}● Active MySQL Server Detected — running live database tests.${RESET}\n`);
  } else {
    console.log(`${YELLOW}● MySQL Server Offline / Sandbox Mode — attaching relational in-memory engine.${RESET}\n`);
    setupInMemoryAdapter(db);
  }

  const req = (method, path, body) => makeRequest(null, method, path, body);

  try {
    // ------------------------------------------------------------------------
    // Test 1: Health & Dashboard Analytics
    // ------------------------------------------------------------------------
    console.log(`${BOLD}Group 1: Health & Dashboard Analytics${RESET}`);

    const healthRes = await req('GET', '/api/health');
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'GET /api/health returns HTTP 200');
    assert(healthJson.success === true, 'Health check reports success: true');

    const dashRes = await req('GET', '/api/dashboard/stats');
    const dashJson = await dashRes.json();
    assert(dashRes.status === 200, 'GET /api/dashboard/stats returns HTTP 200');
    assert(dashJson.success === true, 'Dashboard response returns success: true');
    assert(dashJson.data.total_customers >= 8, `total_customers metric is valid (count: ${dashJson.data.total_customers})`);
    assert(dashJson.data.total_accounts >= 9, `total_accounts metric is valid (count: ${dashJson.data.total_accounts})`);
    assert(dashJson.data.total_balance > 0, `total_balance aggregate sum is positive (₹${dashJson.data.total_balance})`);
    assert(Array.isArray(dashJson.data.recent_transactions), 'recent_transactions returns an array');
    console.log();

    // ------------------------------------------------------------------------
    // Test 2: Customer CRUD & Referential Constraints
    // ------------------------------------------------------------------------
    console.log(`${BOLD}Group 2: Customer CRUD & Constraints${RESET}`);

    // Create new customer
    const newCustPayload = {
      name: 'Aarav Gupta',
      email: 'aarav.gupta.test@example.com',
      phone: '+91 91234 56789',
      address: 'Bandra West, Mumbai',
      date_of_birth: '1998-05-15'
    };
    const createCustRes = await req('POST', '/api/customers', newCustPayload);
    const createCustJson = await createCustRes.json();
    assert(createCustRes.status === 201, 'POST /api/customers registers new customer with HTTP 201');
    assert(createCustJson.success === true, 'Registration reports success: true');
    const newCustId = createCustJson.data.customer_id;
    assert(Boolean(newCustId), `Generated Customer ID assigned (#CUST-${newCustId})`);

    // Duplicate email constraint check
    const dupCustRes = await req('POST', '/api/customers', newCustPayload);
    assert(dupCustRes.status === 409 || dupCustRes.status === 400, `Duplicate email registration correctly rejected with HTTP ${dupCustRes.status}`);

    // Update customer
    const updateCustPayload = {
      name: 'Aarav Gupta',
      email: 'aarav.gupta.test@example.com',
      phone: '+91 91234 00000',
      address: 'Altamount Road, Mumbai',
      date_of_birth: '1998-05-15'
    };
    const updateCustRes = await req('PUT', `/api/customers/${newCustId}`, updateCustPayload);
    const updateCustJson = await updateCustRes.json();
    assert(updateCustRes.status === 200, `PUT /api/customers/${newCustId} updates customer profile`);
    assert(updateCustJson.data.phone === '+91 91234 00000', 'Updated phone verified');

    // Attempt deleting customer with active accounts (Customer #1 has accounts #1 and #2)
    const deleteBlockedRes = await req('DELETE', '/api/customers/1');
    assert(deleteBlockedRes.status === 400, 'DELETE /api/customers/1 blocked with HTTP 400 (ON DELETE RESTRICT safeguard)');
    console.log();

    // ------------------------------------------------------------------------
    // Test 3: Account Operations & Soft Delete Rules
    // ------------------------------------------------------------------------
    console.log(`${BOLD}Group 3: Account Operations & Soft Delete Rules${RESET}`);

    // Open Savings account with initial deposit
    const openSavingsRes = await req('POST', '/api/accounts', {
      customer_id: newCustId,
      branch_id: 1,
      account_type: 'Savings',
      initial_deposit: 15000.00
    });
    const openSavingsJson = await openSavingsRes.json();
    assert(openSavingsRes.status === 201, 'POST /api/accounts opens Savings account with HTTP 201');
    const accSavingsId = openSavingsJson.data.account_id;
    assert(parseFloat(openSavingsJson.data.balance) === 15000.00, 'Initial deposit credited (₹15,000.00)');
    assert(openSavingsJson.data.status === 'Active', 'Initial status set to Active');

    // Open Current account
    const openCurrentRes = await req('POST', '/api/accounts', {
      customer_id: newCustId,
      branch_id: 2,
      account_type: 'Current',
      initial_deposit: 50000.00
    });
    const openCurrentJson = await openCurrentRes.json();
    assert(openCurrentRes.status === 201, 'POST /api/accounts opens Current account with HTTP 201');
    const accCurrentId = openCurrentJson.data.account_id;
    assert(parseFloat(openCurrentJson.data.balance) === 50000.00, 'Initial deposit credited (₹50,000.00)');

    // Attempt closing account with non-zero balance (Savings account has ₹15,000)
    const closeBlockedRes = await req('PATCH', `/api/accounts/${accSavingsId}/status`, { status: 'Closed' });
    assert(closeBlockedRes.status === 400, 'PATCH status to Closed on non-zero balance account blocked with HTTP 400');

    // Open an empty account (₹0 balance) and close it
    const openZeroRes = await req('POST', '/api/accounts', {
      customer_id: newCustId,
      branch_id: 3,
      account_type: 'Savings',
      initial_deposit: 0.00
    });
    const openZeroJson = await openZeroRes.json();
    const zeroAccId = openZeroJson.data.account_id;
    assert(parseFloat(openZeroJson.data.balance) === 0.00, 'Zero-balance account opened successfully');

    const closeZeroRes = await req('PATCH', `/api/accounts/${zeroAccId}/status`, { status: 'Closed' });
    const closeZeroJson = await closeZeroRes.json();
    assert(closeZeroRes.status === 200, 'PATCH status to Closed on ₹0.00 balance account succeeds with HTTP 200');
    assert(closeZeroJson.data.status === 'Closed', 'Account verified in Closed state (soft delete)');
    console.log();

    // ------------------------------------------------------------------------
    // Test 4: ACID Transactions & Financial Safety
    // ------------------------------------------------------------------------
    console.log(`${BOLD}Group 4: ACID Transactions & Financial Safety${RESET}`);

    // Deposit Cash
    const depRes = await req('POST', '/api/transactions/deposit', {
      account_id: accSavingsId,
      amount: 5000.00,
      description: 'Counter cash deposit'
    });
    const depJson = await depRes.json();
    assert(depRes.status === 200, 'POST /api/transactions/deposit executes successfully');
    assert(parseFloat(depJson.data.new_balance) === 20000.00, 'Savings balance incremented: ₹15,000 + ₹5,000 = ₹20,000.00');

    // Non-positive amount rejection
    const negDepRes = await req('POST', '/api/transactions/deposit', {
      account_id: accSavingsId,
      amount: -500.00
    });
    assert(negDepRes.status === 400, 'Negative deposit amount (-₹500.00) rejected with HTTP 400');

    const zeroDepRes = await req('POST', '/api/transactions/deposit', {
      account_id: accSavingsId,
      amount: 0.00
    });
    assert(zeroDepRes.status === 400, 'Zero deposit amount (₹0.00) rejected with HTTP 400');

    // Withdraw Cash
    const wthRes = await req('POST', '/api/transactions/withdraw', {
      account_id: accSavingsId,
      amount: 4000.00,
      description: 'ATM withdrawal'
    });
    const wthJson = await wthRes.json();
    assert(wthRes.status === 200, 'POST /api/transactions/withdraw executes successfully');
    assert(parseFloat(wthJson.data.new_balance) === 16000.00, 'Savings balance decremented: ₹20,000 - ₹4,000 = ₹16,000.00');

    // Attempt withdrawal exceeding balance (attempting ₹999,999 on ₹16,000 balance)
    const overdrawRes = await req('POST', '/api/transactions/withdraw', {
      account_id: accSavingsId,
      amount: 999999.00
    });
    const overdrawJson = await overdrawRes.json();
    assert(overdrawRes.status === 400, 'Overdraft withdrawal rejected with HTTP 400');
    assert(overdrawJson.message.toLowerCase().includes('insufficient'), 'Error message confirms "Insufficient Funds"');

    // Inter-Account Transfer (Current -> Savings: ₹10,000.00)
    const transferRes = await req('POST', '/api/transactions/transfer', {
      from_account_id: accCurrentId,
      to_account_id: accSavingsId,
      amount: 10000.00,
      description: 'Internal treasury rebalance'
    });
    const transferJson = await transferRes.json();
    assert(transferRes.status === 200, 'POST /api/transactions/transfer completes with HTTP 200');
    assert(transferJson.data.status === 'Completed', 'Transfer marked as Completed');

    // Verify balances atomically shifted
    const verifySavings = await req('GET', `/api/accounts/${accSavingsId}`);
    const verifySavingsJson = await verifySavings.json();
    assert(parseFloat(verifySavingsJson.data.balance) === 26000.00, 'Receiver credited atomically: ₹16,000 + ₹10,000 = ₹26,000.00');

    const verifyCurrent = await req('GET', `/api/accounts/${accCurrentId}`);
    const verifyCurrentJson = await verifyCurrent.json();
    assert(parseFloat(verifyCurrentJson.data.balance) === 40000.00, 'Sender debited atomically: ₹50,000 - ₹10,000 = ₹40,000.00');

    // Rollback Verification: Attempt transfer exceeding balance
    const failedTransferRes = await req('POST', '/api/transactions/transfer', {
      from_account_id: accCurrentId,
      to_account_id: accSavingsId,
      amount: 9999999.00
    });
    assert(failedTransferRes.status === 400, 'Excessive transfer rejected with HTTP 400');

    // Confirm balances remain completely untouched (Zero Partial Debits)
    const rollbackSavings = await req('GET', `/api/accounts/${accSavingsId}`);
    const rollbackSavingsJson = await rollbackSavings.json();
    assert(parseFloat(rollbackSavingsJson.data.balance) === 26000.00, 'Rollback verified: Receiver balance remains exactly ₹26,000.00');

    const rollbackCurrent = await req('GET', `/api/accounts/${accCurrentId}`);
    const rollbackCurrentJson = await rollbackCurrent.json();
    assert(parseFloat(rollbackCurrentJson.data.balance) === 40000.00, 'Rollback verified: Sender balance remains exactly ₹40,000.00');

    // Self-transfer check
    const selfTransferRes = await req('POST', '/api/transactions/transfer', {
      from_account_id: accCurrentId,
      to_account_id: accCurrentId,
      amount: 500.00
    });
    assert(selfTransferRes.status === 400, 'Self-transfer (from_account_id === to_account_id) rejected with HTTP 400');

    console.log();
    console.log(`${BOLD}${GREEN}================================================================${RESET}`);
    console.log(`${BOLD}${GREEN}   ALL ${totalTests} TESTS PASSED WITH ZERO FAILURES (100% SUCCESS)    ${RESET}`);
    console.log(`${BOLD}${GREEN}================================================================${RESET}\n`);

    process.exit(0);
  } catch (err) {
    console.error(`\n${BOLD}${RED}Test suite terminated with error:${RESET}`, err.message);
    console.error(`Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests + 1}\n`);
    process.exit(1);
  }
}

runIntegrationTests();
