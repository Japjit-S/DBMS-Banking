/**
 * Banking Management System - Accounts View Logic
 */

(function (window) {
  const AccountView = {
    searchQuery: '',
    statusFilter: 'ALL',
    typeFilter: 'ALL',

    init() {
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      const searchInput = document.getElementById('account-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.render();
        });
      }

      const statusSelect = document.getElementById('account-status-filter');
      if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
          this.statusFilter = e.target.value;
          this.render();
        });
      }

      const typeSelect = document.getElementById('account-type-filter');
      if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
          this.typeFilter = e.target.value;
          this.render();
        });
      }

      const btnOpenAcc = document.getElementById('btn-open-account');
      if (btnOpenAcc) {
        btnOpenAcc.addEventListener('click', () => {
          this.openAddModal();
        });
      }
    },

    render() {
      const tbody = document.getElementById('accounts-table-body');
      const countBadge = document.getElementById('account-count-badge');
      if (!tbody) return;

      const accounts = window.BankingStore.getAccounts();
      if (countBadge) {
        const activeCount = accounts.filter(a => a.status === 'Active').length;
        countBadge.textContent = `${activeCount} Active / ${accounts.length} Total`;
      }

      const filtered = accounts.filter(acc => {
        const customer = window.BankingStore.getCustomer(acc.customer_id);
        const branch = window.BankingStore.getBranch(acc.branch_id);

        if (this.statusFilter !== 'ALL' && acc.status !== this.statusFilter) {
          return false;
        }

        if (this.typeFilter !== 'ALL' && acc.account_type !== this.typeFilter) {
          return false;
        }

        if (this.searchQuery) {
          const q = this.searchQuery;
          const custName = customer ? customer.name.toLowerCase() : '';
          const branchName = branch ? branch.branch_name.toLowerCase() : '';
          const ifsc = branch ? branch.IFSC_code.toLowerCase() : '';
          const accNum = acc.account_number.toLowerCase();

          return (
            accNum.includes(q) ||
            custName.includes(q) ||
            branchName.includes(q) ||
            ifsc.includes(q)
          );
        }

        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-table-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <h5>No Accounts Found</h5>
                <p>No account records match your selected filter criteria.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(acc => {
        const customer = window.BankingStore.getCustomer(acc.customer_id);
        const branch = window.BankingStore.getBranch(acc.branch_id);

        return `
          <tr>
            <td class="cell-mono cell-strong">${acc.account_number}</td>
            <td>
              <div class="cell-strong">${customer ? this.escape(customer.name) : 'Unknown'}</div>
              <div class="cell-muted">ID: #CUST-${String(acc.customer_id).padStart(3, '0')}</div>
            </td>
            <td>
              <div>${branch ? this.escape(branch.branch_name) : 'Unknown'}</div>
              <div class="cell-muted cell-mono">${branch ? branch.IFSC_code : 'N/A'}</div>
            </td>
            <td>
              <span class="badge ${acc.account_type === 'Savings' ? 'badge-type-savings' : 'badge-type-current'}">
                ${acc.account_type}
              </span>
            </td>
            <td class="cell-mono cell-strong">
              ₹${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </td>
            <td>
              <span class="badge ${acc.status === 'Active' ? 'badge-active' : 'badge-closed'}">
                ${acc.status}
              </span>
            </td>
            <td class="cell-muted">${acc.opening_date}</td>
            <td>
              <div class="table-actions">
                <button class="action-icon-btn" title="View Details" onclick="window.AccountView.openDetailsModal(${acc.account_id})">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  Details
                </button>
                ${
                  acc.status === 'Active'
                    ? `<button class="action-icon-btn btn-delete" title="Close Account" onclick="window.AccountView.handleCloseAccount(${acc.account_id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        Close
                      </button>`
                    : `<button class="action-icon-btn" title="Reactivate Account" onclick="window.AccountView.handleReopenAccount(${acc.account_id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                        Reopen
                      </button>`
                }
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    openAddModal(preselectedCustomerId = null) {
      const customers = window.BankingStore.getCustomers();
      const branches = window.BankingStore.getBranches();

      if (customers.length === 0) {
        window.App.toast('Notice', 'Please register at least one Customer before opening an account.', 'warning');
        window.CustomerView.openAddModal();
        return;
      }

      const custOptions = customers.map(c => `
        <option value="${c.customer_id}" ${preselectedCustomerId === c.customer_id ? 'selected' : ''}>
          #CUST-${String(c.customer_id).padStart(3, '0')} — ${this.escape(c.name)} (${c.email})
        </option>
      `).join('');

      const branchOptions = branches.map(b => `
        <option value="${b.branch_id}">
          ${this.escape(b.branch_name)} (${b.IFSC_code})
        </option>
      `).join('');

      const content = `
        <form id="open-account-form" onsubmit="event.preventDefault(); window.AccountView.submitOpen();">
          <div class="form-group">
            <label>Select Customer <span class="req">*</span></label>
            <select id="acc-customer-id" class="form-control" required>
              ${custOptions}
            </select>
            <div class="form-helper">Account will be linked to this primary account holder.</div>
          </div>

          <div class="form-group">
            <label>Select Branch <span class="req">*</span></label>
            <select id="acc-branch-id" class="form-control" required>
              ${branchOptions}
            </select>
          </div>

          <div class="form-group">
            <label>Account Type <span class="req">*</span></label>
            <select id="acc-type" class="form-control" required>
              <option value="Savings">Savings Account</option>
              <option value="Current">Current Account</option>
            </select>
          </div>

          <div class="form-group">
            <label>Initial Opening Deposit (₹)</label>
            <div class="currency-input-wrap">
              <span class="currency-symbol">₹</span>
              <input type="number" id="acc-initial-balance" class="form-control" step="0.01" min="0" value="5000.00" placeholder="0.00" />
            </div>
            <div class="form-helper">An initial deposit transaction will be logged immediately.</div>
          </div>
        </form>
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="window.App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.AccountView.submitOpen()">Open Account</button>
      `;

      window.App.openModal('Open New Bank Account', content, footer);
    },

    submitOpen() {
      const customerId = document.getElementById('acc-customer-id')?.value;
      const branchId = document.getElementById('acc-branch-id')?.value;
      const accountType = document.getElementById('acc-type')?.value;
      const initialBal = document.getElementById('acc-initial-balance')?.value;

      try {
        const newAcc = window.BankingStore.addAccount({
          customer_id: customerId,
          branch_id: branchId,
          account_type: accountType,
          initial_balance: initialBal
        });

        window.App.closeModal();
        window.App.toast('Account Opened', `Account ${newAcc.account_number} created successfully with balance ₹${newAcc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`, 'success');
      } catch (err) {
        window.App.toast('Error Opening Account', err.message, 'error');
      }
    },

    handleCloseAccount(accountId) {
      const account = window.BankingStore.getAccount(accountId);
      if (!account) return;

      // Business Rule Validation: Balance must be zero to close
      if (account.balance > 0) {
        window.App.toast(
          'Closure Blocked (Business Rule)',
          `Cannot close ${account.account_number}. Account holds an active balance of ₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Balance must be ₹0.00. Please withdraw or transfer funds before closing.`,
          'error'
        );
        return;
      }

      window.App.confirm(
        'Confirm Account Closure',
        `Are you sure you want to close account ${account.account_number}?`,
        () => {
          try {
            window.BankingStore.updateAccountStatus(accountId, 'Closed');
            window.App.toast('Account Closed', `Account ${account.account_number} status changed to Closed.`, 'info');
          } catch (err) {
            window.App.toast('Closure Failed', err.message, 'error');
          }
        }
      );
    },

    handleReopenAccount(accountId) {
      const account = window.BankingStore.getAccount(accountId);
      if (!account) return;

      window.App.confirm(
        'Reactivate Account',
        `Reactivate account ${account.account_number}?`,
        () => {
          try {
            window.BankingStore.updateAccountStatus(accountId, 'Active');
            window.App.toast('Account Reactivated', `Account ${account.account_number} is now Active.`, 'success');
          } catch (err) {
            window.App.toast('Reactivation Failed', err.message, 'error');
          }
        }
      );
    },

    openDetailsModal(accountId) {
      const account = window.BankingStore.getAccount(accountId);
      if (!account) return;

      const customer = window.BankingStore.getCustomer(account.customer_id);
      const branch = window.BankingStore.getBranch(account.branch_id);
      const txns = window.BankingStore.getTransactions(account.account_id);
      const transfers = window.BankingStore.getTransfers(account.account_id);

      const recentActivity = [
        ...txns.map(t => ({
          ref: `TXN-${t.transaction_id}`,
          type: t.transaction_type,
          amount: t.amount,
          date: t.transaction_date,
          desc: t.description
        })),
        ...transfers.map(tr => ({
          ref: `TRF-${tr.transfer_id}`,
          type: 'Transfer',
          amount: tr.amount,
          date: tr.transfer_date,
          desc: tr.from_account_id === account.account_id
            ? `Transfer Out to Acc #${tr.to_account_id}`
            : `Transfer In from Acc #${tr.from_account_id}`
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      const activityHtml = recentActivity.length > 0
        ? `
          <div class="table-responsive" style="margin-top: 14px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${recentActivity.map(act => `
                  <tr>
                    <td class="cell-mono">${act.ref}</td>
                    <td>
                      <span class="badge ${act.type === 'Deposit' ? 'badge-deposit' : act.type === 'Withdrawal' ? 'badge-withdrawal' : 'badge-transfer'}">
                        ${act.type}
                      </span>
                    </td>
                    <td class="cell-mono cell-strong">₹${act.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td class="cell-muted">${new Date(act.date).toLocaleDateString()}</td>
                    <td><small>${this.escape(act.desc)}</small></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `
        : `<p class="cell-muted" style="margin-top:12px; font-style: italic;">No transaction history for this account yet.</p>`;

      const content = `
        <div class="details-list">
          <div class="details-row">
            <span class="details-label">Account Number</span>
            <span class="details-val cell-mono" style="color:var(--blue-600);">${account.account_number}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Account Holder</span>
            <span class="details-val">${customer ? this.escape(customer.name) : 'N/A'}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Branch & IFSC</span>
            <span class="details-val">${branch ? `${this.escape(branch.branch_name)} (${branch.IFSC_code})` : 'N/A'}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Account Type</span>
            <span class="details-val"><span class="badge ${account.account_type === 'Savings' ? 'badge-type-savings' : 'badge-type-current'}">${account.account_type}</span></span>
          </div>
          <div class="details-row">
            <span class="details-label">Current Balance</span>
            <span class="details-val cell-mono" style="font-size:1.15rem; color:var(--emerald-600);">
              ₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div class="details-row">
            <span class="details-label">Status</span>
            <span class="details-val">
              <span class="badge ${account.status === 'Active' ? 'badge-active' : 'badge-closed'}">${account.status}</span>
            </span>
          </div>
          <div class="details-row">
            <span class="details-label">Opening Date</span>
            <span class="details-val">${account.opening_date}</span>
          </div>
        </div>

        <h5 style="margin-top: 20px; font-weight: 700; color: var(--slate-900);">Recent Account Activity</h5>
        ${activityHtml}
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="window.App.closeModal()">Close</button>
        <button class="btn btn-primary" onclick="window.App.closeModal(); window.App.switchView('transactions'); window.TransactionView.prefillAccount(${account.account_id});">
          Perform Transaction
        </button>
      `;

      window.App.openModal(`Account Details — ${account.account_number}`, content, footer);
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

  window.AccountView = AccountView;
})(window);
