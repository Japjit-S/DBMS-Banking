/**
 * Banking Management System - Accounts View Logic
 * Communicates with backend via window.BankingApi.
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
          this.searchQuery = e.target.value.trim();
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

    async render() {
      const tbody = document.getElementById('accounts-table-body');
      const countBadge = document.getElementById('account-count-badge');
      if (!tbody) return;

      try {
        const accounts = await window.BankingApi.getAccounts(
          this.searchQuery,
          this.statusFilter !== 'ALL' ? this.statusFilter : null
        );

        let filtered = accounts;
        if (this.typeFilter !== 'ALL') {
          filtered = filtered.filter(a => a.account_type === this.typeFilter);
        }

        if (countBadge) {
          const activeCount = filtered.filter(a => a.status === 'Active').length;
          countBadge.textContent = `${activeCount} Active / ${filtered.length} Total`;
        }

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
          const openingFmt = acc.opening_date ? String(acc.opening_date).split('T')[0] : 'N/A';
          const bal = parseFloat(acc.balance || 0);

          return `
            <tr>
              <td class="cell-mono cell-strong">${acc.account_number}</td>
              <td>
                <div class="cell-strong">${this.escape(acc.customer_name || 'N/A')}</div>
                <div class="cell-muted">ID: #CUST-${String(acc.customer_id).padStart(3, '0')}</div>
              </td>
              <td>
                <div>${this.escape(acc.branch_name || 'N/A')}</div>
                <div class="cell-muted cell-mono">${this.escape(acc.IFSC_code || 'N/A')}</div>
              </td>
              <td>
                <span class="badge ${acc.account_type === 'Savings' ? 'badge-type-savings' : 'badge-type-current'}">
                  ${acc.account_type}
                </span>
              </td>
              <td class="cell-mono cell-strong">
                ₹${bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td>
                <span class="badge ${acc.status === 'Active' ? 'badge-active' : 'badge-closed'}">
                  ${acc.status}
                </span>
              </td>
              <td class="cell-muted">${openingFmt}</td>
              <td>
                <div class="table-actions">
                  <button class="action-icon-btn" title="View Details" onclick="window.AccountView.openDetailsModal(${acc.account_id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    Details
                  </button>
                  ${
                    acc.status === 'Active'
                      ? `<button class="action-icon-btn btn-delete" title="Close Account" onclick="window.AccountView.handleCloseAccount(${acc.account_id}, '${acc.account_number}', ${bal})">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                          Close
                        </button>`
                      : `<button class="action-icon-btn" title="Reactivate Account" onclick="window.AccountView.handleReopenAccount(${acc.account_id}, '${acc.account_number}')">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                          Reopen
                        </button>`
                  }
                </div>
              </td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        console.error('Failed to render accounts:', err);
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="empty-table-state" style="color:var(--rose-600); padding:24px;">
              Error loading accounts: ${this.escape(err.message)}
            </td>
          </tr>
        `;
      }
    },

    async openDetailsModal(accountId) {
      try {
        const acc = await window.BankingApi.getAccountById(accountId);
        if (!acc) return;

        const openingFmt = acc.opening_date ? String(acc.opening_date).split('T')[0] : 'N/A';
        const bal = parseFloat(acc.balance || 0);

        const content = `
          <div class="details-list">
            <div class="details-row">
              <span class="details-label">Account Number</span>
              <span class="details-val cell-mono cell-strong">${acc.account_number}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Account Type</span>
              <span class="details-val">
                <span class="badge ${acc.account_type === 'Savings' ? 'badge-type-savings' : 'badge-type-current'}">${acc.account_type}</span>
              </span>
            </div>
            <div class="details-row">
              <span class="details-label">Account Status</span>
              <span class="details-val">
                <span class="badge ${acc.status === 'Active' ? 'badge-active' : 'badge-closed'}">${acc.status}</span>
              </span>
            </div>
            <div class="details-row" style="background:#f0fdf4; padding:10px; border-radius:6px;">
              <span class="details-label" style="font-weight:700; color:var(--slate-800);">Current Ledger Balance</span>
              <span class="details-val cell-mono" style="color:var(--emerald-600); font-size:1.15rem;">₹${bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Account Holder</span>
              <span class="details-val">${this.escape(acc.customer_name)} (#CUST-${String(acc.customer_id).padStart(3, '0')})</span>
            </div>
            <div class="details-row">
              <span class="details-label">Customer Contact</span>
              <span class="details-val">${this.escape(acc.customer_email || '—')} • ${this.escape(acc.customer_phone || '—')}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Branch & IFSC</span>
              <span class="details-val">${this.escape(acc.branch_name)} (<span class="cell-mono">${acc.IFSC_code}</span>)</span>
            </div>
            <div class="details-row">
              <span class="details-label">Branch Location</span>
              <span class="details-val" style="text-align: right; max-width: 60%;">${this.escape(acc.branch_address || '—')}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Opening Date</span>
              <span class="details-val">${openingFmt}</span>
            </div>
          </div>
        `;

        const footer = `
          <button class="btn btn-secondary" onclick="window.App.closeModal()">Close</button>
          <button class="btn btn-primary" onclick="window.App.closeModal(); window.App.switchView('transactions');">
            Perform Transaction
          </button>
        `;

        window.App.openModal(`Account Details — ${acc.account_number}`, content, footer);
      } catch (err) {
        window.App.toast('Error', err.message, 'error');
      }
    },

    async handleCloseAccount(accountId, accountNumber, balance) {
      if (balance !== 0) {
        window.App.toast(
          'Closure Blocked (Non-Zero Balance)',
          `Account ${accountNumber} has an active balance of ₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Database business rules require balance to be exactly ₹0.00 prior to closure. Withdraw or transfer all remaining funds first.`,
          'error'
        );
        return;
      }

      window.App.confirm(
        'Confirm Account Closure',
        `Are you sure you want to close account ${accountNumber}? Balance is confirmed at ₹0.00. The account record will transition to 'Closed' while preserving referential audit trails.`,
        async () => {
          try {
            await window.BankingApi.updateAccountStatus(accountId, 'Closed');
            window.App.toast('Account Closed', `Account ${accountNumber} has been closed.`, 'info');
            this.render();
            if (window.App && typeof window.App.refreshSystemData === 'function') {
              window.App.refreshSystemData(false);
            }
          } catch (err) {
            window.App.toast('Closure Failed', err.message, 'error');
          }
        }
      );
    },

    async handleReopenAccount(accountId, accountNumber) {
      try {
        await window.BankingApi.updateAccountStatus(accountId, 'Active');
        window.App.toast('Account Reactivated', `Account ${accountNumber} is now Active.`, 'success');
        this.render();
        if (window.App && typeof window.App.refreshSystemData === 'function') {
          window.App.refreshSystemData(false);
        }
      } catch (err) {
        window.App.toast('Reactivation Failed', err.message, 'error');
      }
    },

    async openAddModal(preselectedCustomerId = null) {
      try {
        const [customers, branches] = await Promise.all([
          window.BankingApi.getCustomers(),
          window.BankingApi.getBranches()
        ]);

        const customerOptions = customers.map(c => {
          const selected = preselectedCustomerId && Number(c.customer_id) === Number(preselectedCustomerId) ? 'selected' : '';
          return `<option value="${c.customer_id}" ${selected}>#CUST-${String(c.customer_id).padStart(3, '0')} — ${this.escape(c.name)} (${this.escape(c.email)})</option>`;
        }).join('');

        const branchOptions = branches.map(b => {
          return `<option value="${b.branch_id}">${this.escape(b.branch_name)} (${b.IFSC_code})</option>`;
        }).join('');

        const content = `
          <form id="open-account-form" onsubmit="event.preventDefault(); window.AccountView.submitAdd();">
            <div class="form-group">
              <label>Select Customer <span class="req">*</span></label>
              <select id="acc-customer-id" class="form-control" required>
                <option value="">-- Choose Account Holder --</option>
                ${customerOptions}
              </select>
            </div>
            <div class="form-group">
              <label>Designated Branch <span class="req">*</span></label>
              <select id="acc-branch-id" class="form-control" required>
                <option value="">-- Choose Bank Branch --</option>
                ${branchOptions}
              </select>
            </div>
            <div class="form-group">
              <label>Account Type <span class="req">*</span></label>
              <select id="acc-type" class="form-control" required>
                <option value="Savings">Savings Account</option>
                <option value="Current">Current / Commercial Account</option>
              </select>
              <div class="form-helper">Limited strictly to 'Savings' and 'Current' accounts per institutional policy.</div>
            </div>
            <div class="form-group">
              <label>Initial Opening Deposit (₹)</label>
              <input type="number" id="acc-initial-deposit" class="form-control" placeholder="0.00" min="0" step="0.01" value="0.00" />
              <div class="form-helper">If positive, an opening Deposit entry is atomically recorded in BankTransaction.</div>
            </div>
          </form>
        `;

        const footer = `
          <button class="btn btn-secondary" onclick="window.App.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="window.AccountView.submitAdd()">Open Account</button>
        `;

        window.App.openModal('Open New Bank Account', content, footer);
      } catch (err) {
        window.App.toast('Error Loading Form Data', err.message, 'error');
      }
    },

    async submitAdd() {
      const customerId = document.getElementById('acc-customer-id')?.value;
      const branchId = document.getElementById('acc-branch-id')?.value;
      const accountType = document.getElementById('acc-type')?.value;
      const initialDeposit = parseFloat(document.getElementById('acc-initial-deposit')?.value || 0);

      if (!customerId || !branchId) {
        window.App.toast('Incomplete Form', 'Please choose both a customer and a branch.', 'warning');
        return;
      }

      try {
        const newAcc = await window.BankingApi.openAccount({
          customer_id: customerId,
          branch_id: branchId,
          account_type: accountType,
          initial_deposit: initialDeposit
        });

        window.App.closeModal();
        window.App.toast(
          'Account Opened Successfully',
          `Account ${newAcc.account_number} created with initial balance of ₹${parseFloat(newAcc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          'success'
        );
        this.render();
        if (window.App && typeof window.App.refreshSystemData === 'function') {
          window.App.refreshSystemData(false);
        }
      } catch (err) {
        window.App.toast('Opening Failed', err.message, 'error');
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

  window.AccountView = AccountView;
})(window);
