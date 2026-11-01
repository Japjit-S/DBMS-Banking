/**
 * Banking Management System - Transactions & Transfers View Logic
 */

(function (window) {
  const TransactionView = {
    historyFilter: 'ALL',
    searchQuery: '',

    init() {
      this.bindEvents();
      this.populateAccountSelects();
      this.renderHistory();
    },

    bindEvents() {
      // Form Submissions
      const depositForm = document.getElementById('form-deposit');
      if (depositForm) {
        depositForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleDeposit();
        });
      }

      const withdrawForm = document.getElementById('form-withdraw');
      if (withdrawForm) {
        withdrawForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleWithdraw();
        });
      }

      const transferForm = document.getElementById('form-transfer');
      if (transferForm) {
        transferForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleTransfer();
        });
      }

      // History Filter Controls
      const historyFilterSelect = document.getElementById('txn-history-type-filter');
      if (historyFilterSelect) {
        historyFilterSelect.addEventListener('change', (e) => {
          this.historyFilter = e.target.value;
          this.renderHistory();
        });
      }

      const historySearchInput = document.getElementById('txn-history-search-input');
      if (historySearchInput) {
        historySearchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.renderHistory();
        });
      }

      // Balance feedback listeners for Withdrawal and Transfer
      const withdrawAccSelect = document.getElementById('withdraw-account-id');
      if (withdrawAccSelect) {
        withdrawAccSelect.addEventListener('change', (e) => {
          this.updateWithdrawalBalanceHint(e.target.value);
        });
      }

      const transferFromSelect = document.getElementById('transfer-from-account-id');
      if (transferFromSelect) {
        transferFromSelect.addEventListener('change', (e) => {
          this.updateTransferBalanceHint(e.target.value);
        });
      }
    },

    populateAccountSelects() {
      const accounts = window.BankingStore.getAccounts().filter(a => a.status === 'Active');
      const customers = window.BankingStore.getCustomers();

      const makeOptions = (defaultPrompt) => {
        let html = `<option value="">-- ${defaultPrompt} --</option>`;
        accounts.forEach(acc => {
          const cust = customers.find(c => c.customer_id === acc.customer_id);
          const custName = cust ? cust.name : 'Unknown';
          const bal = acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 });
          html += `<option value="${acc.account_id}">${acc.account_number} (${custName}) — Bal: ₹${bal}</option>`;
        });
        return html;
      };

      const depSelect = document.getElementById('deposit-account-id');
      const wthSelect = document.getElementById('withdraw-account-id');
      const trfFrom = document.getElementById('transfer-from-account-id');
      const trfTo = document.getElementById('transfer-to-account-id');

      const prevDep = depSelect ? depSelect.value : '';
      const prevWth = wthSelect ? wthSelect.value : '';
      const prevFrom = trfFrom ? trfFrom.value : '';
      const prevTo = trfTo ? trfTo.value : '';

      if (depSelect) depSelect.innerHTML = makeOptions('Select Target Account');
      if (wthSelect) wthSelect.innerHTML = makeOptions('Select Source Account');
      if (trfFrom) trfFrom.innerHTML = makeOptions('Source Debit Account');
      if (trfTo) trfTo.innerHTML = makeOptions('Destination Credit Account');

      if (depSelect && prevDep) depSelect.value = prevDep;
      if (wthSelect && prevWth) {
        wthSelect.value = prevWth;
        this.updateWithdrawalBalanceHint(prevWth);
      }
      if (trfFrom && prevFrom) {
        trfFrom.value = prevFrom;
        this.updateTransferBalanceHint(prevFrom);
      }
      if (trfTo && prevTo) trfTo.value = prevTo;
    },

    updateWithdrawalBalanceHint(accountId) {
      const hint = document.getElementById('withdraw-balance-hint');
      if (!hint) return;
      if (!accountId) {
        hint.textContent = 'Select an account to view available balance';
        return;
      }
      const acc = window.BankingStore.getAccount(accountId);
      if (acc) {
        hint.innerHTML = `Available balance: <strong style="color:var(--emerald-600)">₹${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>`;
      }
    },

    updateTransferBalanceHint(accountId) {
      const hint = document.getElementById('transfer-balance-hint');
      if (!hint) return;
      if (!accountId) {
        hint.textContent = 'Select source account to view available balance';
        return;
      }
      const acc = window.BankingStore.getAccount(accountId);
      if (acc) {
        hint.innerHTML = `Available balance: <strong style="color:var(--emerald-600)">₹${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>`;
      }
    },

    handleDeposit() {
      const accId = document.getElementById('deposit-account-id')?.value;
      const amount = parseFloat(document.getElementById('deposit-amount')?.value);
      const desc = document.getElementById('deposit-desc')?.value || 'Cash / Counter Deposit';

      if (!accId) {
        window.App.toast('Form Incomplete', 'Please select a valid account to deposit into.', 'warning');
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        window.App.toast('Validation Error', 'Deposit amount must be greater than zero.', 'error');
        return;
      }

      try {
        const result = window.BankingStore.deposit(accId, amount, desc);
        window.App.toast(
          'Deposit Successful',
          `Credited ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to ${result.account.account_number}. New balance: ₹${result.account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          'success'
        );
        document.getElementById('form-deposit').reset();
      } catch (err) {
        window.App.toast('Deposit Error', err.message, 'error');
      }
    },

    handleWithdraw() {
      const accId = document.getElementById('withdraw-account-id')?.value;
      const amount = parseFloat(document.getElementById('withdraw-amount')?.value);
      const desc = document.getElementById('withdraw-desc')?.value || 'ATM / Branch Withdrawal';

      if (!accId) {
        window.App.toast('Form Incomplete', 'Please select an account to withdraw from.', 'warning');
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        window.App.toast('Validation Error', 'Withdrawal amount must be greater than zero.', 'error');
        return;
      }

      const acc = window.BankingStore.getAccount(accId);
      if (acc && amount > acc.balance) {
        window.App.toast(
          'Insufficient Funds',
          `Cannot withdraw ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Available balance is only ₹${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          'error'
        );
        return;
      }

      try {
        const result = window.BankingStore.withdraw(accId, amount, desc);
        window.App.toast(
          'Withdrawal Successful',
          `Debited ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from ${result.account.account_number}. Remaining balance: ₹${result.account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          'success'
        );
        document.getElementById('form-withdraw').reset();
        this.updateWithdrawalBalanceHint('');
      } catch (err) {
        window.App.toast('Withdrawal Error', err.message, 'error');
      }
    },

    handleTransfer() {
      const fromId = document.getElementById('transfer-from-account-id')?.value;
      const toId = document.getElementById('transfer-to-account-id')?.value;
      const amount = parseFloat(document.getElementById('transfer-amount')?.value);
      const desc = document.getElementById('transfer-desc')?.value || 'Online Fund Transfer';

      if (!fromId || !toId) {
        window.App.toast('Form Incomplete', 'Please select both source and destination accounts.', 'warning');
        return;
      }

      if (fromId === toId) {
        window.App.toast(
          'Validation Error',
          'Source and destination accounts cannot be identical. Self-transfers are rejected.',
          'error'
        );
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        window.App.toast('Validation Error', 'Transfer amount must be greater than zero.', 'error');
        return;
      }

      const fromAcc = window.BankingStore.getAccount(fromId);
      if (fromAcc && amount > fromAcc.balance) {
        window.App.toast(
          'Transfer Rejected',
          `Insufficient funds in source account ${fromAcc.account_number} (Balance: ₹${fromAcc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).`,
          'error'
        );
        return;
      }

      try {
        const result = window.BankingStore.transfer(fromId, toId, amount, desc);
        window.App.toast(
          'Transfer Complete (Atomic)',
          `Transferred ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from ${result.fromAccount.account_number} to ${result.toAccount.account_number}. Ref #${result.transfer.transfer_id}.`,
          'success'
        );
        document.getElementById('form-transfer').reset();
        this.updateTransferBalanceHint('');
      } catch (err) {
        window.App.toast('Transfer Failed', err.message, 'error');
      }
    },

    prefillAccount(accountId) {
      this.populateAccountSelects();
      const dep = document.getElementById('deposit-account-id');
      const wth = document.getElementById('withdraw-account-id');
      const trf = document.getElementById('transfer-from-account-id');

      if (dep) dep.value = accountId;
      if (wth) {
        wth.value = accountId;
        this.updateWithdrawalBalanceHint(accountId);
      }
      if (trf) {
        trf.value = accountId;
        this.updateTransferBalanceHint(accountId);
      }
    },

    renderHistory() {
      const tbody = document.getElementById('txn-history-table-body');
      if (!tbody) return;

      const rawTxns = window.BankingStore.getTransactions();
      const rawTransfers = window.BankingStore.getTransfers();

      // Normalize into a single unified audit ledger
      const items = [];

      rawTxns.forEach(t => {
        const acc = window.BankingStore.getAccount(t.account_id);
        const cust = acc ? window.BankingStore.getCustomer(acc.customer_id) : null;
        items.push({
          ref: `TXN-${t.transaction_id}`,
          rawType: t.transaction_type, // 'Deposit' or 'Withdrawal'
          type: t.transaction_type,
          accountNumber: acc ? acc.account_number : `Acc #${t.account_id}`,
          customerName: cust ? cust.name : 'Unknown',
          amount: t.amount,
          date: t.transaction_date,
          desc: t.description,
          status: 'Completed'
        });
      });

      rawTransfers.forEach(tr => {
        const fromAcc = window.BankingStore.getAccount(tr.from_account_id);
        const toAcc = window.BankingStore.getAccount(tr.to_account_id);
        items.push({
          ref: `TRF-${tr.transfer_id}`,
          rawType: 'Transfer',
          type: 'Transfer',
          accountNumber: `${fromAcc ? fromAcc.account_number : tr.from_account_id} ➔ ${toAcc ? toAcc.account_number : tr.to_account_id}`,
          customerName: 'Fund Transfer',
          amount: tr.amount,
          date: tr.transfer_date,
          desc: tr.description,
          status: tr.status
        });
      });

      // Sort newest first
      items.sort((a, b) => new Date(b.date) - new Date(a.date));

      const filtered = items.filter(item => {
        if (this.historyFilter !== 'ALL') {
          if (this.historyFilter === 'Deposit' && item.rawType !== 'Deposit') return false;
          if (this.historyFilter === 'Withdrawal' && item.rawType !== 'Withdrawal') return false;
          if (this.historyFilter === 'Transfer' && item.rawType !== 'Transfer') return false;
        }

        if (this.searchQuery) {
          const q = this.searchQuery;
          return (
            item.ref.toLowerCase().includes(q) ||
            item.accountNumber.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q) ||
            item.type.toLowerCase().includes(q)
          );
        }

        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-table-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h5>No Transactions Found</h5>
                <p>No transaction history matching your filter criteria was found.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(item => {
        let badgeClass = 'badge-deposit';
        let amountClass = 'cell-amount-pos';
        let amountPrefix = '+';

        if (item.type === 'Withdrawal') {
          badgeClass = 'badge-withdrawal';
          amountClass = 'cell-amount-neg';
          amountPrefix = '-';
        } else if (item.type === 'Transfer') {
          badgeClass = 'badge-transfer';
          amountClass = 'cell-amount-neutral';
          amountPrefix = '⇄ ';
        }

        const dateObj = new Date(item.date);
        const formattedDate = dateObj.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        const formattedTime = dateObj.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        });

        return `
          <tr>
            <td class="cell-mono cell-strong">${item.ref}</td>
            <td>
              <span class="badge ${badgeClass}">${item.type}</span>
            </td>
            <td>
              <div class="cell-mono cell-strong">${item.accountNumber}</div>
              <div class="cell-muted">${this.escape(item.customerName)}</div>
            </td>
            <td class="${amountClass}">
              ${amountPrefix}₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </td>
            <td>
              <div>${formattedDate}</div>
              <div class="cell-muted cell-mono">${formattedTime}</div>
            </td>
            <td>
              <span title="${this.escape(item.desc)}" style="display:inline-block; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${this.escape(item.desc)}
              </span>
            </td>
            <td>
              <span class="badge badge-active">${item.status}</span>
            </td>
          </tr>
        `;
      }).join('');
    },

    escape(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  window.TransactionView = TransactionView;
})(window);
