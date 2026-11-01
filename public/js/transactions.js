/**
 * Banking Management System - Transactions & Transfers View Logic
 * Communicates with backend via window.BankingApi.
 */

(function (window) {
  const TransactionView = {
    historyFilter: 'ALL',
    searchQuery: '',
    activeAccounts: [],

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

    async populateAccountSelects() {
      try {
        const accounts = await window.BankingApi.getAccounts('', 'Active');
        this.activeAccounts = accounts;

        const makeOptions = (defaultPrompt) => {
          let html = `<option value="">-- ${defaultPrompt} --</option>`;
          accounts.forEach(acc => {
            const custName = acc.customer_name || 'Account Holder';
            const bal = parseFloat(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            html += `<option value="${acc.account_id}">${acc.account_number} (${this.escape(custName)}) — Bal: ₹${bal}</option>`;
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
      } catch (err) {
        console.error('Failed to populate account selects:', err);
      }
    },

    updateWithdrawalBalanceHint(accountId) {
      const hint = document.getElementById('withdraw-balance-hint');
      if (!hint) return;
      if (!accountId) {
        hint.textContent = 'Select an account to view available balance';
        return;
      }
      const acc = this.activeAccounts.find(a => String(a.account_id) === String(accountId));
      if (acc) {
        const bal = parseFloat(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        hint.innerHTML = `Available balance: <strong style="color:var(--emerald-600)">₹${bal}</strong>`;
      }
    },

    updateTransferBalanceHint(accountId) {
      const hint = document.getElementById('transfer-balance-hint');
      if (!hint) return;
      if (!accountId) {
        hint.textContent = 'Select source account to view available balance';
        return;
      }
      const acc = this.activeAccounts.find(a => String(a.account_id) === String(accountId));
      if (acc) {
        const bal = parseFloat(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        hint.innerHTML = `Available balance: <strong style="color:var(--emerald-600)">₹${bal}</strong>`;
      }
    },

    async handleDeposit() {
      const accId = document.getElementById('deposit-account-id')?.value;
      const amountInput = document.getElementById('deposit-amount');
      const descInput = document.getElementById('deposit-desc');
      const amount = parseFloat(amountInput?.value);
      const desc = descInput?.value || 'Cash / Counter Deposit';

      if (!accId) {
        window.App.toast('Form Incomplete', 'Please select a valid account to deposit into.', 'warning');
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        window.App.toast('Invalid Amount', 'Deposit amount must be a positive number greater than 0.', 'warning');
        return;
      }

      try {
        const res = await window.BankingApi.deposit(accId, amount, desc);
        if (amountInput) amountInput.value = '';
        if (descInput) descInput.value = '';

        window.App.toast(
          'Deposit Successful',
          `Credited ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} to account ${res.account_number}. New Balance: ₹${parseFloat(res.new_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          'success'
        );

        await this.populateAccountSelects();
        await this.renderHistory();
        if (window.App && typeof window.App.refreshSystemData === 'function') {
          window.App.refreshSystemData(false);
        }
      } catch (err) {
        window.App.toast('Deposit Failed', err.message, 'error');
      }
    },

    async handleWithdraw() {
      const accId = document.getElementById('withdraw-account-id')?.value;
      const amountInput = document.getElementById('withdraw-amount');
      const descInput = document.getElementById('withdraw-desc');
      const amount = parseFloat(amountInput?.value);
      const desc = descInput?.value || 'Cash / ATM Withdrawal';

      if (!accId) {
        window.App.toast('Form Incomplete', 'Please select a source account.', 'warning');
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        window.App.toast('Invalid Amount', 'Withdrawal amount must be a positive number greater than 0.', 'warning');
        return;
      }

      try {
        const res = await window.BankingApi.withdraw(accId, amount, desc);
        if (amountInput) amountInput.value = '';
        if (descInput) descInput.value = '';

        window.App.toast(
          'Withdrawal Successful',
          `Debited ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} from account ${res.account_number}. Remaining Balance: ₹${parseFloat(res.new_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          'success'
        );

        await this.populateAccountSelects();
        await this.renderHistory();
        if (window.App && typeof window.App.refreshSystemData === 'function') {
          window.App.refreshSystemData(false);
        }
      } catch (err) {
        window.App.toast('Withdrawal Declined', err.message, 'error');
      }
    },

    async handleTransfer() {
      const fromId = document.getElementById('transfer-from-account-id')?.value;
      const toId = document.getElementById('transfer-to-account-id')?.value;
      const amountInput = document.getElementById('transfer-amount');
      const descInput = document.getElementById('transfer-desc');
      const amount = parseFloat(amountInput?.value);
      const desc = descInput?.value || 'Inter-Account Fund Transfer';

      if (!fromId || !toId) {
        window.App.toast('Form Incomplete', 'Both source debit and destination credit accounts must be selected.', 'warning');
        return;
      }

      if (fromId === toId) {
        window.App.toast('Invalid Transfer', 'Self-transfer is invalid. Source and destination accounts must be distinct.', 'error');
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        window.App.toast('Invalid Amount', 'Transfer amount must be a positive number greater than 0.', 'warning');
        return;
      }

      try {
        const res = await window.BankingApi.transfer(fromId, toId, amount, desc);
        if (amountInput) amountInput.value = '';
        if (descInput) descInput.value = '';

        window.App.toast(
          'ACID Transfer Successful',
          `Transferred ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} from ${res.from_account_number} to ${res.to_account_number}. Balances updated atomically.`,
          'success'
        );

        await this.populateAccountSelects();
        await this.renderHistory();
        if (window.App && typeof window.App.refreshSystemData === 'function') {
          window.App.refreshSystemData(false);
        }
      } catch (err) {
        window.App.toast('Transfer Failed / Rolled Back', err.message, 'error');
      }
    },

    async renderHistory() {
      const tbody = document.getElementById('txn-history-table-body');
      if (!tbody) return;

      try {
        const records = await window.BankingApi.getTransactionHistory();

        let filtered = records;

        if (this.historyFilter !== 'ALL') {
          filtered = filtered.filter(item => item.type === this.historyFilter);
        }

        if (this.searchQuery) {
          const q = this.searchQuery;
          filtered = filtered.filter(item => {
            const accInfo = (item.account_number || item.account_info || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const id = String(item.id || '').toLowerCase();
            return accInfo.includes(q) || desc.includes(q) || id.includes(q);
          });
        }

        if (filtered.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7">
                <div class="empty-table-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                  <h5>No Operations Recorded</h5>
                  <p>No transactions or fund transfers match your current filter settings.</p>
                </div>
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = filtered.map(item => {
          let badgeClass = 'badge-deposit';
          let amountClass = 'cell-amount-pos';
          let prefix = '+';

          if (item.type === 'Withdrawal') {
            badgeClass = 'badge-withdrawal';
            amountClass = 'cell-amount-neg';
            prefix = '-';
          } else if (item.type === 'Transfer') {
            badgeClass = 'badge-transfer';
            amountClass = 'cell-amount-neutral';
            prefix = '⇄ ';
          }

          const rawDate = item.timestamp || item.transaction_date || item.transfer_date;
          const dt = rawDate ? new Date(rawDate) : new Date();
          const dateFmt = dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
          const timeFmt = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          const refPrefix = item.record_type === 'Transfer' || item.type === 'Transfer' ? 'TRF' : 'TXN';
          const accDisplay = item.account_number || item.account_info || 'N/A';
          const amt = parseFloat(item.amount || 0);

          return `
            <tr>
              <td class="cell-mono cell-strong">#${refPrefix}-${item.id}</td>
              <td><span class="badge ${badgeClass}">${item.type}</span></td>
              <td class="cell-mono">${this.escape(accDisplay)}</td>
              <td class="${amountClass}">${prefix}₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td>
                <div>${dateFmt}</div>
                <div class="cell-muted cell-mono">${timeFmt}</div>
              </td>
              <td>
                <span title="${this.escape(item.description)}" style="display:inline-block; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${this.escape(item.description || '—')}
                </span>
              </td>
              <td>
                <span class="badge badge-active">${item.status || 'Completed'}</span>
              </td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        console.error('Failed to render transaction history:', err);
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="empty-table-state" style="color:var(--rose-600); padding:24px;">
              Error loading transaction history: ${this.escape(err.message)}
            </td>
          </tr>
        `;
      }
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
