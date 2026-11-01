/**
 * Banking Management System - Mock Data & In-Memory / LocalStorage Store
 * Mimics relational database tables: Customer, Branch, Account, BankTransaction, Transfer.
 */

(function (window) {
  const STORAGE_KEY = 'DBMS_BANKING_STORE_V1';

  // Seed Data Definition
  const SEED_BRANCHES = [
    {
      branch_id: 1,
      branch_name: 'Hyderabad Main Branch',
      IFSC_code: 'SBIN0001234',
      address: 'Road No 12, Banjara Hills, Hyderabad, Telangana'
    },
    {
      branch_id: 2,
      branch_name: 'Hitec City Tech Branch',
      IFSC_code: 'HDFC0004567',
      address: 'Cyber Towers Quad, Madhapur, Hyderabad, Telangana'
    },
    {
      branch_id: 3,
      branch_name: 'Bangalore Central Branch',
      IFSC_code: 'ICIC0007890',
      address: '100ft Road, Indiranagar, Bengaluru, Karnataka'
    },
    {
      branch_id: 4,
      branch_name: 'Mumbai Nariman Point Branch',
      IFSC_code: 'KKBK0002468',
      address: 'Maker Chambers, Nariman Point, Mumbai, Maharashtra'
    },
    {
      branch_id: 5,
      branch_name: 'New Delhi Connaught Place',
      IFSC_code: 'PUNB0001357',
      address: 'Inner Circle, Connaught Place, New Delhi'
    }
  ];

  const SEED_CUSTOMERS = [
    {
      customer_id: 1,
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@example.com',
      phone: '+91 98765 43210',
      address: 'Plot 42, Jubilee Hills, Hyderabad',
      date_of_birth: '1988-04-12',
      created_at: '2025-01-10T10:00:00.000Z'
    },
    {
      customer_id: 2,
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+91 98234 56789',
      address: 'Flat 302, Palm Heights, Bengaluru',
      date_of_birth: '1992-09-25',
      created_at: '2025-02-15T11:30:00.000Z'
    },
    {
      customer_id: 3,
      name: 'Japjit Singh',
      email: 'japjit.singh@example.com',
      phone: '+91 99887 76655',
      address: 'B-12 Defence Colony, New Delhi',
      date_of_birth: '2003-06-15',
      created_at: '2025-03-01T09:15:00.000Z'
    },
    {
      customer_id: 4,
      name: 'Ananya Sen',
      email: 'ananya.sen@example.com',
      phone: '+91 97112 34567',
      address: '14 Ballygunge Circular Rd, Kolkata',
      date_of_birth: '1995-11-03',
      created_at: '2025-03-20T14:45:00.000Z'
    },
    {
      customer_id: 5,
      name: 'Rohan Verma',
      email: 'rohan.verma@example.com',
      phone: '+91 98450 12345',
      address: '5th Main, Koramangala, Bengaluru',
      date_of_birth: '1990-01-20',
      created_at: '2025-04-05T08:00:00.000Z'
    },
    {
      customer_id: 6,
      name: 'Sneha Reddy',
      email: 'sneha.reddy@example.com',
      phone: '+91 96321 85296',
      address: 'Street 3, Gachibowli, Hyderabad',
      date_of_birth: '1998-07-14',
      created_at: '2025-05-12T16:20:00.000Z'
    },
    {
      customer_id: 7,
      name: 'Vikram Malhotra',
      email: 'vikram.malhotra@example.com',
      phone: '+91 98111 22334',
      address: 'C-8 Marine Drive, Mumbai',
      date_of_birth: '1985-12-08',
      created_at: '2025-06-01T12:00:00.000Z'
    },
    {
      customer_id: 8,
      name: 'Kavita Iyer',
      email: 'kavita.iyer@example.com',
      phone: '+91 94440 98765',
      address: 'T-Nagar 4th Street, Chennai',
      date_of_birth: '1994-03-30',
      created_at: '2025-07-18T10:10:00.000Z'
    }
  ];

  const SEED_ACCOUNTS = [
    {
      account_id: 1,
      customer_id: 1,
      branch_id: 1,
      account_number: 'ACC-1001001',
      account_type: 'Savings',
      balance: 145000.00,
      status: 'Active',
      opening_date: '2025-01-15'
    },
    {
      account_id: 2,
      customer_id: 1,
      branch_id: 2,
      account_number: 'ACC-1001002',
      account_type: 'Current',
      balance: 520000.00,
      status: 'Active',
      opening_date: '2025-02-01'
    },
    {
      account_id: 3,
      customer_id: 2,
      branch_id: 3,
      account_number: 'ACC-1001003',
      account_type: 'Savings',
      balance: 89450.50,
      status: 'Active',
      opening_date: '2025-02-20'
    },
    {
      account_id: 4,
      customer_id: 3,
      branch_id: 5,
      account_number: 'ACC-1001004',
      account_type: 'Savings',
      balance: 312000.00,
      status: 'Active',
      opening_date: '2025-03-05'
    },
    {
      account_id: 5,
      customer_id: 4,
      branch_id: 1,
      account_number: 'ACC-1001005',
      account_type: 'Savings',
      balance: 45200.00,
      status: 'Active',
      opening_date: '2025-03-25'
    },
    {
      account_id: 6,
      customer_id: 5,
      branch_id: 3,
      account_number: 'ACC-1001006',
      account_type: 'Current',
      balance: 18500.00,
      status: 'Active',
      opening_date: '2025-04-10'
    },
    {
      account_id: 7,
      customer_id: 6,
      branch_id: 2,
      account_number: 'ACC-1001007',
      account_type: 'Savings',
      balance: 234000.00,
      status: 'Active',
      opening_date: '2025-05-15'
    },
    {
      account_id: 8,
      customer_id: 7,
      branch_id: 4,
      account_number: 'ACC-1001008',
      account_type: 'Current',
      balance: 890000.00,
      status: 'Active',
      opening_date: '2025-06-05'
    },
    {
      account_id: 9,
      customer_id: 8,
      branch_id: 1,
      account_number: 'ACC-1001009',
      account_type: 'Savings',
      balance: 0.00,
      status: 'Closed',
      opening_date: '2025-07-20'
    }
  ];

  const SEED_TRANSACTIONS = [
    {
      transaction_id: 1,
      account_id: 1,
      transaction_type: 'Deposit',
      amount: 50000.00,
      transaction_date: '2026-10-20T10:15:00.000Z',
      description: 'Initial branch cash deposit'
    },
    {
      transaction_id: 2,
      account_id: 2,
      transaction_type: 'Deposit',
      amount: 200000.00,
      transaction_date: '2026-10-21T11:30:00.000Z',
      description: 'Vendor payment invoice #904'
    },
    {
      transaction_id: 3,
      account_id: 4,
      transaction_type: 'Deposit',
      amount: 75000.00,
      transaction_date: '2026-10-22T09:45:00.000Z',
      description: 'Consultancy honorarium credit'
    },
    {
      transaction_id: 4,
      account_id: 1,
      transaction_type: 'Withdrawal',
      amount: 15000.00,
      transaction_date: '2026-10-23T14:20:00.000Z',
      description: 'ATM Cash Withdrawal'
    },
    {
      transaction_id: 5,
      account_id: 3,
      transaction_type: 'Deposit',
      amount: 30000.00,
      transaction_date: '2026-10-24T16:00:00.000Z',
      description: 'Monthly salary dividend'
    },
    {
      transaction_id: 6,
      account_id: 7,
      transaction_type: 'Deposit',
      amount: 100000.00,
      transaction_date: '2026-10-25T13:10:00.000Z',
      description: 'Term deposit maturity credit'
    },
    {
      transaction_id: 7,
      account_id: 4,
      transaction_type: 'Withdrawal',
      amount: 25000.00,
      transaction_date: '2026-10-26T17:40:00.000Z',
      description: 'Hardware equipment expense'
    },
    {
      transaction_id: 8,
      account_id: 8,
      transaction_type: 'Deposit',
      amount: 250000.00,
      transaction_date: '2026-10-27T10:05:00.000Z',
      description: 'Commercial contract disbursement'
    }
  ];

  const SEED_TRANSFERS = [
    {
      transfer_id: 1,
      from_account_id: 2,
      to_account_id: 1,
      amount: 25000.00,
      transfer_date: '2026-10-26T11:00:00.000Z',
      status: 'Completed',
      description: 'Inter-account personal reserve rebalance'
    },
    {
      transfer_id: 2,
      from_account_id: 4,
      to_account_id: 3,
      amount: 12000.00,
      transfer_date: '2026-10-27T14:30:00.000Z',
      status: 'Completed',
      description: 'DBMS research lab fee settlement'
    }
  ];

  class BankingStore {
    constructor() {
      this.data = this.loadState();
    }

    loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.customers && parsed.accounts && parsed.branches) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to parse localStorage, resetting to seed data.', e);
      }
      return this.getDefaultState();
    }

    getDefaultState() {
      return {
        branches: JSON.parse(JSON.stringify(SEED_BRANCHES)),
        customers: JSON.parse(JSON.stringify(SEED_CUSTOMERS)),
        accounts: JSON.parse(JSON.stringify(SEED_ACCOUNTS)),
        transactions: JSON.parse(JSON.stringify(SEED_TRANSACTIONS)),
        transfers: JSON.parse(JSON.stringify(SEED_TRANSFERS))
      };
    }

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error('Failed to save state to localStorage:', e);
      }
      this.notify();
    }

    resetToDefaults() {
      this.data = this.getDefaultState();
      this.saveState();
      return true;
    }

    notify() {
      window.dispatchEvent(new CustomEvent('bank-store-updated', { detail: { timestamp: Date.now() } }));
    }

    // --- Branch Methods ---
    getBranches() {
      return [...this.data.branches];
    }

    getBranch(id) {
      return this.data.branches.find(b => b.branch_id === Number(id)) || null;
    }

    // --- Customer Methods ---
    getCustomers() {
      return [...this.data.customers];
    }

    getCustomer(id) {
      return this.data.customers.find(c => c.customer_id === Number(id)) || null;
    }

    addCustomer(custData) {
      const email = (custData.email || '').trim().toLowerCase();
      if (!custData.name || !email || !custData.phone) {
        throw new Error('Name, email, and phone are strictly required.');
      }
      const existing = this.data.customers.find(c => c.email.toLowerCase() === email);
      if (existing) {
        throw new Error(`A customer with email "${email}" already exists.`);
      }

      const nextId = this.data.customers.length > 0
        ? Math.max(...this.data.customers.map(c => c.customer_id)) + 1
        : 1;

      const newCustomer = {
        customer_id: nextId,
        name: custData.name.trim(),
        email: email,
        phone: custData.phone.trim(),
        address: (custData.address || '').trim(),
        date_of_birth: custData.date_of_birth || '',
        created_at: new Date().toISOString()
      };

      this.data.customers.push(newCustomer);
      this.saveState();
      return newCustomer;
    }

    updateCustomer(id, custData) {
      const customer = this.getCustomer(id);
      if (!customer) {
        throw new Error(`Customer with ID ${id} not found.`);
      }

      const email = (custData.email || '').trim().toLowerCase();
      if (!custData.name || !email || !custData.phone) {
        throw new Error('Name, email, and phone are strictly required.');
      }

      const conflict = this.data.customers.find(
        c => c.customer_id !== Number(id) && c.email.toLowerCase() === email
      );
      if (conflict) {
        throw new Error(`Email "${email}" is already used by customer #${conflict.customer_id}.`);
      }

      customer.name = custData.name.trim();
      customer.email = email;
      customer.phone = custData.phone.trim();
      customer.address = (custData.address || '').trim();
      if (custData.date_of_birth) {
        customer.date_of_birth = custData.date_of_birth;
      }

      this.saveState();
      return customer;
    }

    deleteCustomer(id) {
      const custId = Number(id);
      const customer = this.getCustomer(custId);
      if (!customer) {
        throw new Error(`Customer with ID ${id} does not exist.`);
      }

      // Referential Integrity Constraint: Cannot delete customer with associated accounts
      const associatedAccounts = this.data.accounts.filter(a => a.customer_id === custId);
      if (associatedAccounts.length > 0) {
        throw new Error(
          `Cannot delete customer #${custId} ("${customer.name}"). Restrictive Foreign Key: Customer has ${associatedAccounts.length} active/associated account(s). Close and remove accounts first.`
        );
      }

      this.data.customers = this.data.customers.filter(c => c.customer_id !== custId);
      this.saveState();
      return true;
    }

    getCustomerAccounts(customerId) {
      const custId = Number(customerId);
      return this.data.accounts.filter(a => a.customer_id === custId);
    }

    // --- Account Methods ---
    getAccounts() {
      return [...this.data.accounts];
    }

    getAccount(id) {
      return this.data.accounts.find(a => a.account_id === Number(id)) || null;
    }

    getAccountByNumber(accNumber) {
      const num = (accNumber || '').trim().toUpperCase();
      return this.data.accounts.find(a => a.account_number.toUpperCase() === num) || null;
    }

    addAccount(accData) {
      const customerId = Number(accData.customer_id);
      const branchId = Number(accData.branch_id);
      const accountType = accData.account_type || 'Savings';
      const initialBalance = parseFloat(accData.initial_balance || 0);

      const customer = this.getCustomer(customerId);
      if (!customer) {
        throw new Error('Valid Customer selection is required.');
      }

      const branch = this.getBranch(branchId);
      if (!branch) {
        throw new Error('Valid Branch selection is required.');
      }

      if (isNaN(initialBalance) || initialBalance < 0) {
        throw new Error('Initial deposit cannot be negative.');
      }

      const nextId = this.data.accounts.length > 0
        ? Math.max(...this.data.accounts.map(a => a.account_id)) + 1
        : 1;

      // Generate realistic sequential Account Number
      const accountNumber = `ACC-${1001000 + nextId}`;

      const newAccount = {
        account_id: nextId,
        customer_id: customerId,
        branch_id: branchId,
        account_number: accountNumber,
        account_type: accountType,
        balance: Math.round(initialBalance * 100) / 100,
        status: 'Active',
        opening_date: new Date().toISOString().split('T')[0]
      };

      this.data.accounts.push(newAccount);

      // Record initial deposit transaction if positive
      if (initialBalance > 0) {
        const nextTxnId = this.data.transactions.length > 0
          ? Math.max(...this.data.transactions.map(t => t.transaction_id)) + 1
          : 1;
        this.data.transactions.push({
          transaction_id: nextTxnId,
          account_id: nextId,
          transaction_type: 'Deposit',
          amount: Math.round(initialBalance * 100) / 100,
          transaction_date: new Date().toISOString(),
          description: 'Account Opening Deposit'
        });
      }

      this.saveState();
      return newAccount;
    }

    updateAccountStatus(id, newStatus) {
      const account = this.getAccount(id);
      if (!account) {
        throw new Error(`Account #${id} not found.`);
      }

      if (newStatus !== 'Active' && newStatus !== 'Closed') {
        throw new Error('Status must be either "Active" or "Closed".');
      }

      // Business Rule: Prevent closure when an account has a non-zero balance
      if (newStatus === 'Closed' && account.balance > 0) {
        throw new Error(
          `Cannot close Account ${account.account_number}. Balance must be ₹0.00 before closure (current balance: ₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}). Withdraw or transfer funds first.`
        );
      }

      account.status = newStatus;
      this.saveState();
      return account;
    }

    // --- Financial Operations (Deposit, Withdraw, Transfer) ---
    deposit(accountId, rawAmount, description = 'Account Deposit') {
      const account = this.getAccount(accountId);
      if (!account) {
        throw new Error('Target account not found.');
      }
      if (account.status !== 'Active') {
        throw new Error(`Account ${account.account_number} is ${account.status}. Deposits are disallowed.`);
      }

      const amount = parseFloat(rawAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Deposit amount must be a positive number greater than 0.');
      }

      const rounded = Math.round(amount * 100) / 100;
      account.balance = Math.round((account.balance + rounded) * 100) / 100;

      const nextTxnId = this.data.transactions.length > 0
        ? Math.max(...this.data.transactions.map(t => t.transaction_id)) + 1
        : 1;

      const txn = {
        transaction_id: nextTxnId,
        account_id: account.account_id,
        transaction_type: 'Deposit',
        amount: rounded,
        transaction_date: new Date().toISOString(),
        description: description.trim() || 'Cash Deposit'
      };

      this.data.transactions.push(txn);
      this.saveState();
      return { account, transaction: txn };
    }

    withdraw(accountId, rawAmount, description = 'Account Withdrawal') {
      const account = this.getAccount(accountId);
      if (!account) {
        throw new Error('Target account not found.');
      }
      if (account.status !== 'Active') {
        throw new Error(`Account ${account.account_number} is ${account.status}. Withdrawals are disallowed.`);
      }

      const amount = parseFloat(rawAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Withdrawal amount must be a positive number greater than 0.');
      }

      const rounded = Math.round(amount * 100) / 100;
      if (rounded > account.balance) {
        throw new Error(
          `Insufficient funds! Available balance: ₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, requested: ₹${rounded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`
        );
      }

      account.balance = Math.round((account.balance - rounded) * 100) / 100;

      const nextTxnId = this.data.transactions.length > 0
        ? Math.max(...this.data.transactions.map(t => t.transaction_id)) + 1
        : 1;

      const txn = {
        transaction_id: nextTxnId,
        account_id: account.account_id,
        transaction_type: 'Withdrawal',
        amount: rounded,
        transaction_date: new Date().toISOString(),
        description: description.trim() || 'Cash Withdrawal'
      };

      this.data.transactions.push(txn);
      this.saveState();
      return { account, transaction: txn };
    }

    transfer(fromAccountId, toAccountId, rawAmount, description = 'Fund Transfer') {
      const fromId = Number(fromAccountId);
      const toId = Number(toAccountId);

      if (fromId === toId) {
        throw new Error('Self-transfer is invalid. Source and destination accounts must be distinct.');
      }

      const fromAccount = this.getAccount(fromId);
      const toAccount = this.getAccount(toId);

      if (!fromAccount) throw new Error('Source account not found.');
      if (!toAccount) throw new Error('Destination account not found.');

      if (fromAccount.status !== 'Active') {
        throw new Error(`Source account ${fromAccount.account_number} is ${fromAccount.status}.`);
      }
      if (toAccount.status !== 'Active') {
        throw new Error(`Destination account ${toAccount.account_number} is ${toAccount.status}.`);
      }

      const amount = parseFloat(rawAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Transfer amount must be a positive number greater than 0.');
      }

      const rounded = Math.round(amount * 100) / 100;
      if (rounded > fromAccount.balance) {
        throw new Error(
          `Transfer declined: Insufficient funds in ${fromAccount.account_number}. Balance: ₹${fromAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, attempted: ₹${rounded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`
        );
      }

      // Atomic Balance Mutation (Simulating MySQL ACID Transaction)
      fromAccount.balance = Math.round((fromAccount.balance - rounded) * 100) / 100;
      toAccount.balance = Math.round((toAccount.balance + rounded) * 100) / 100;

      const nextTransferId = this.data.transfers.length > 0
        ? Math.max(...this.data.transfers.map(t => t.transfer_id)) + 1
        : 1;

      const transferRecord = {
        transfer_id: nextTransferId,
        from_account_id: fromAccount.account_id,
        to_account_id: toAccount.account_id,
        amount: rounded,
        transfer_date: new Date().toISOString(),
        status: 'Completed',
        description: description.trim() || `Transfer ${fromAccount.account_number} ➔ ${toAccount.account_number}`
      };

      this.data.transfers.push(transferRecord);

      // Complementary audit ledger entries in BankTransaction
      const nextTxnId = this.data.transactions.length > 0
        ? Math.max(...this.data.transactions.map(t => t.transaction_id)) + 1
        : 1;

      this.data.transactions.push({
        transaction_id: nextTxnId,
        account_id: fromAccount.account_id,
        transaction_type: 'Withdrawal',
        amount: rounded,
        transaction_date: transferRecord.transfer_date,
        description: `Transfer Out to ${toAccount.account_number} (Ref #${nextTransferId})`
      });

      this.data.transactions.push({
        transaction_id: nextTxnId + 1,
        account_id: toAccount.account_id,
        transaction_type: 'Deposit',
        amount: rounded,
        transaction_date: transferRecord.transfer_date,
        description: `Transfer In from ${fromAccount.account_number} (Ref #${nextTransferId})`
      });

      this.saveState();
      return {
        fromAccount,
        toAccount,
        transfer: transferRecord
      };
    }

    // --- Query & Dashboard Helpers ---
    getTransactions(accountId = null) {
      let list = [...this.data.transactions];
      if (accountId) {
        list = list.filter(t => t.account_id === Number(accountId));
      }
      return list.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    }

    getTransfers(accountId = null) {
      let list = [...this.data.transfers];
      if (accountId) {
        const id = Number(accountId);
        list = list.filter(t => t.from_account_id === id || t.to_account_id === id);
      }
      return list.sort((a, b) => new Date(b.transfer_date) - new Date(a.transfer_date));
    }

    getDashboardMetrics() {
      const totalCustomers = this.data.customers.length;
      const totalAccounts = this.data.accounts.length;
      const activeAccounts = this.data.accounts.filter(a => a.status === 'Active').length;
      const closedAccounts = totalAccounts - activeAccounts;

      const totalBalance = this.data.accounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
      const totalTransactions = this.data.transactions.length + this.data.transfers.length;

      // Compile chronological recent activity
      const recentTxns = this.data.transactions.map(t => {
        const acc = this.getAccount(t.account_id);
        return {
          id: `TXN-${t.transaction_id}`,
          type: t.transaction_type,
          accountNumber: acc ? acc.account_number : `Acc #${t.account_id}`,
          amount: t.amount,
          date: t.transaction_date,
          description: t.description,
          status: 'Completed',
          category: 'Standard Transaction'
        };
      });

      const recentTransfers = this.data.transfers.map(tr => {
        const fromAcc = this.getAccount(tr.from_account_id);
        const toAcc = this.getAccount(tr.to_account_id);
        return {
          id: `TRF-${tr.transfer_id}`,
          type: 'Transfer',
          accountNumber: `${fromAcc ? fromAcc.account_number : tr.from_account_id} ➔ ${toAcc ? toAcc.account_number : tr.to_account_id}`,
          amount: tr.amount,
          date: tr.transfer_date,
          description: tr.description,
          status: tr.status,
          category: 'Fund Transfer'
        };
      });

      const allActivity = [...recentTxns, ...recentTransfers]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8);

      return {
        totalCustomers,
        totalAccounts,
        activeAccounts,
        closedAccounts,
        totalBalance: Math.round(totalBalance * 100) / 100,
        totalTransactions,
        recentActivity: allActivity
      };
    }
  }

  // Export globally for browser environment
  window.BankingStore = new BankingStore();
})(window);
