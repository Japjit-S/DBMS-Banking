/**
 * Banking Management System - Customers View Logic
 */

(function (window) {
  const CustomerView = {
    searchQuery: '',

    init() {
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      const searchInput = document.getElementById('customer-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.render();
        });
      }

      const btnAdd = document.getElementById('btn-add-customer');
      if (btnAdd) {
        btnAdd.addEventListener('click', () => {
          this.openAddModal();
        });
      }
    },

    render() {
      const tbody = document.getElementById('customers-table-body');
      const countBadge = document.getElementById('customer-count-badge');
      if (!tbody) return;

      const customers = window.BankingStore.getCustomers();
      if (countBadge) {
        countBadge.textContent = `${customers.length} Registered`;
      }

      const filtered = customers.filter(c => {
        if (!this.searchQuery) return true;
        const q = this.searchQuery;
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          String(c.customer_id).includes(q)
        );
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-table-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h5>No Customers Found</h5>
                <p>No customer records match your filter criteria.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(cust => {
        const accounts = window.BankingStore.getCustomerAccounts(cust.customer_id);
        const totalBal = accounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);

        return `
          <tr>
            <td class="cell-mono">#CUST-${String(cust.customer_id).padStart(3, '0')}</td>
            <td>
              <div class="cell-strong">${this.escape(cust.name)}</div>
              <div class="cell-muted">DOB: ${cust.date_of_birth || 'N/A'}</div>
            </td>
            <td>
              <div>${this.escape(cust.email)}</div>
              <div class="cell-muted">${this.escape(cust.phone)}</div>
            </td>
            <td>
              <span title="${this.escape(cust.address)}" style="display:inline-block; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${this.escape(cust.address || '—')}
              </span>
            </td>
            <td>
              <span class="badge ${accounts.length > 0 ? 'badge-active' : 'badge-closed'}">
                ${accounts.length} ${accounts.length === 1 ? 'Account' : 'Accounts'}
              </span>
              <div class="cell-muted" style="margin-top:2px;">₹${totalBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </td>
            <td>
              <span class="cell-muted">${new Date(cust.created_at).toLocaleDateString()}</span>
            </td>
            <td>
              <div class="table-actions">
                <button class="action-icon-btn" title="View Customer Accounts" onclick="window.CustomerView.openViewModal(${cust.customer_id})">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  Accounts
                </button>
                <button class="action-icon-btn" title="Edit Customer" onclick="window.CustomerView.openEditModal(${cust.customer_id})">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Edit
                </button>
                <button class="action-icon-btn btn-delete" title="Delete Customer" onclick="window.CustomerView.confirmDelete(${cust.customer_id})">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    openAddModal() {
      const content = `
        <form id="add-customer-form" onsubmit="event.preventDefault(); window.CustomerView.submitAdd();">
          <div class="form-group">
            <label>Full Legal Name <span class="req">*</span></label>
            <input type="text" id="cust-name" class="form-control" placeholder="e.g. Rajesh Sharma" required />
          </div>
          <div class="form-group">
            <label>Email Address <span class="req">*</span></label>
            <input type="email" id="cust-email" class="form-control" placeholder="e.g. rajesh.sharma@example.com" required />
            <div class="form-helper">Must be unique across the customer database.</div>
          </div>
          <div class="form-group">
            <label>Phone Number <span class="req">*</span></label>
            <input type="tel" id="cust-phone" class="form-control" placeholder="e.g. +91 98765 43210" required />
          </div>
          <div class="form-group">
            <label>Date of Birth <span class="req">*</span></label>
            <input type="date" id="cust-dob" class="form-control" value="1995-01-01" required />
          </div>
          <div class="form-group">
            <label>Residential / Mailing Address</label>
            <textarea id="cust-address" class="form-control" rows="2" placeholder="e.g. Plot 42, Jubilee Hills, Hyderabad"></textarea>
          </div>
        </form>
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="window.App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.CustomerView.submitAdd()">Register Customer</button>
      `;

      window.App.openModal('Register New Customer', content, footer);
    },

    submitAdd() {
      const name = document.getElementById('cust-name')?.value;
      const email = document.getElementById('cust-email')?.value;
      const phone = document.getElementById('cust-phone')?.value;
      const dob = document.getElementById('cust-dob')?.value;
      const address = document.getElementById('cust-address')?.value;

      try {
        const newCust = window.BankingStore.addCustomer({
          name,
          email,
          phone,
          date_of_birth: dob,
          address
        });
        window.App.closeModal();
        window.App.toast('Customer Created', `Customer #${newCust.customer_id} (${newCust.name}) registered successfully.`, 'success');
      } catch (err) {
        window.App.toast('Validation Error', err.message, 'error');
      }
    },

    openEditModal(customerId) {
      const customer = window.BankingStore.getCustomer(customerId);
      if (!customer) return;

      const content = `
        <form id="edit-customer-form" onsubmit="event.preventDefault(); window.CustomerView.submitEdit(${customer.customer_id});">
          <div class="form-group">
            <label>Customer ID</label>
            <input type="text" class="form-control" value="#CUST-${String(customer.customer_id).padStart(3, '0')}" disabled style="background:#f1f5f9; cursor:not-allowed;" />
          </div>
          <div class="form-group">
            <label>Full Legal Name <span class="req">*</span></label>
            <input type="text" id="edit-cust-name" class="form-control" value="${this.escape(customer.name)}" required />
          </div>
          <div class="form-group">
            <label>Email Address <span class="req">*</span></label>
            <input type="email" id="edit-cust-email" class="form-control" value="${this.escape(customer.email)}" required />
          </div>
          <div class="form-group">
            <label>Phone Number <span class="req">*</span></label>
            <input type="tel" id="edit-cust-phone" class="form-control" value="${this.escape(customer.phone)}" required />
          </div>
          <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" id="edit-cust-dob" class="form-control" value="${customer.date_of_birth || ''}" />
          </div>
          <div class="form-group">
            <label>Residential / Mailing Address</label>
            <textarea id="edit-cust-address" class="form-control" rows="2">${this.escape(customer.address || '')}</textarea>
          </div>
        </form>
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="window.App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.CustomerView.submitEdit(${customer.customer_id})">Save Changes</button>
      `;

      window.App.openModal(`Edit Customer #${customer.customer_id}`, content, footer);
    },

    submitEdit(customerId) {
      const name = document.getElementById('edit-cust-name')?.value;
      const email = document.getElementById('edit-cust-email')?.value;
      const phone = document.getElementById('edit-cust-phone')?.value;
      const dob = document.getElementById('edit-cust-dob')?.value;
      const address = document.getElementById('edit-cust-address')?.value;

      try {
        const updated = window.BankingStore.updateCustomer(customerId, {
          name,
          email,
          phone,
          date_of_birth: dob,
          address
        });
        window.App.closeModal();
        window.App.toast('Customer Updated', `Customer #${updated.customer_id} details updated.`, 'success');
      } catch (err) {
        window.App.toast('Update Failed', err.message, 'error');
      }
    },

    openViewModal(customerId) {
      const customer = window.BankingStore.getCustomer(customerId);
      if (!customer) return;

      const accounts = window.BankingStore.getCustomerAccounts(customerId);
      const totalBal = accounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);

      const accountsListHtml = accounts.length > 0
        ? `
          <div class="table-responsive" style="margin-top: 14px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Account No</th>
                  <th>Type</th>
                  <th>Branch</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${accounts.map(acc => {
                  const branch = window.BankingStore.getBranch(acc.branch_id);
                  return `
                    <tr>
                      <td class="cell-mono">${acc.account_number}</td>
                      <td><span class="badge ${acc.account_type === 'Savings' ? 'badge-type-savings' : 'badge-type-current'}">${acc.account_type}</span></td>
                      <td>${branch ? branch.branch_name : 'N/A'}</td>
                      <td class="cell-mono cell-strong">₹${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td><span class="badge ${acc.status === 'Active' ? 'badge-active' : 'badge-closed'}">${acc.status}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `
        : `<p class="cell-muted" style="margin-top:12px; font-style: italic;">No bank accounts currently opened for this customer.</p>`;

      const content = `
        <div class="details-list">
          <div class="details-row">
            <span class="details-label">Full Name</span>
            <span class="details-val">${this.escape(customer.name)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Customer ID</span>
            <span class="details-val cell-mono">#CUST-${String(customer.customer_id).padStart(3, '0')}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Email</span>
            <span class="details-val">${this.escape(customer.email)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Phone</span>
            <span class="details-val">${this.escape(customer.phone)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Date of Birth</span>
            <span class="details-val">${customer.date_of_birth || 'N/A'}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Address</span>
            <span class="details-val" style="text-align: right; max-width: 60%;">${this.escape(customer.address || '—')}</span>
          </div>
          <div class="details-row" style="background:#f8fafc; padding: 10px; border-radius: 6px;">
            <span class="details-label" style="font-weight:700; color:var(--slate-800);">Total Balance Across Accounts</span>
            <span class="details-val cell-mono" style="color:var(--emerald-600); font-size:1.1rem;">₹${totalBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <h5 style="margin-top: 20px; font-weight: 700; color: var(--slate-900);">Associated Accounts (${accounts.length})</h5>
        ${accountsListHtml}
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="window.App.closeModal()">Close</button>
        <button class="btn btn-primary" onclick="window.App.closeModal(); window.AccountView.openAddModal(${customer.customer_id});">
          + Open Account For Customer
        </button>
      `;

      window.App.openModal(`Customer Profile — ${customer.name}`, content, footer);
    },

    confirmDelete(customerId) {
      const customer = window.BankingStore.getCustomer(customerId);
      if (!customer) return;

      const accounts = window.BankingStore.getCustomerAccounts(customerId);
      if (accounts.length > 0) {
        window.App.toast(
          'DBMS Constraint: Cannot Delete',
          `Referential Integrity (RESTRICT): Customer #${customer.customer_id} has ${accounts.length} associated account(s). All accounts must be closed and removed first.`,
          'error'
        );
        return;
      }

      window.App.confirm(
        'Confirm Customer Deletion',
        `Are you sure you want to delete customer #${customer.customer_id} ("${customer.name}")? This action cannot be undone.`,
        () => {
          try {
            window.BankingStore.deleteCustomer(customerId);
            window.App.toast('Customer Deleted', `Customer #${customer.customer_id} removed.`, 'info');
          } catch (err) {
            window.App.toast('Deletion Failed', err.message, 'error');
          }
        }
      );
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

  window.CustomerView = CustomerView;
})(window);
