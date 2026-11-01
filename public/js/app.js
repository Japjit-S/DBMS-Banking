/**
 * Banking Management System - Master Application Orchestrator
 * Coordinates Navigation, Dashboard Metrics, Modal Dialogs, and Toasts.
 * Communicates with backend via window.BankingApi.
 */

(function (window) {
  const App = {
    currentView: 'dashboard',

    init() {
      this.bindNavigation();
      this.bindClock();
      this.bindGlobalActions();
      this.initModalListeners();

      // Initialize subviews
      if (window.CustomerView) window.CustomerView.init();
      if (window.AccountView) window.AccountView.init();
      if (window.TransactionView) window.TransactionView.init();

      // Handle initial route
      const initialHash = window.location.hash.replace('#', '') || 'dashboard';
      this.switchView(initialHash);
      this.renderDashboard();
    },

    bindNavigation() {
      const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = link.getAttribute('data-view');
          if (target) {
            this.switchView(target);
          }
        });
      });

      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && hash !== this.currentView) {
          this.switchView(hash);
        }
      });
    },

    switchView(viewName) {
      const validViews = ['dashboard', 'customers', 'accounts', 'transactions'];
      if (!validViews.includes(viewName)) {
        viewName = 'dashboard';
      }

      this.currentView = viewName;
      window.location.hash = viewName;

      // Update Nav Buttons
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update View Sections
      document.querySelectorAll('.view-section').forEach(sec => {
        if (sec.id === `view-${viewName}`) {
          sec.classList.add('active-view');
        } else {
          sec.classList.remove('active-view');
        }
      });

      // Update Header Title
      const titleElem = document.getElementById('header-view-title');
      if (titleElem) {
        const titleMap = {
          dashboard: 'System Overview & Analytics',
          customers: 'Customer Master Directory',
          accounts: 'Account Portfolio & Ledger',
          transactions: 'Financial Operations & Audit Log'
        };
        titleElem.textContent = titleMap[viewName] || 'Banking Management System';
      }

      // Re-render corresponding view content
      this.refreshCurrentView();
    },

    refreshCurrentView() {
      if (this.currentView === 'dashboard') {
        this.renderDashboard();
      } else if (this.currentView === 'customers' && window.CustomerView) {
        window.CustomerView.render();
      } else if (this.currentView === 'accounts' && window.AccountView) {
        window.AccountView.render();
      } else if (this.currentView === 'transactions' && window.TransactionView) {
        window.TransactionView.populateAccountSelects();
        window.TransactionView.renderHistory();
      }
    },

    async refreshSystemData(showToast = true) {
      await this.renderDashboard();
      if (window.CustomerView) await window.CustomerView.render();
      if (window.AccountView) await window.AccountView.render();
      if (window.TransactionView) {
        await window.TransactionView.populateAccountSelects();
        await window.TransactionView.renderHistory();
      }
      if (showToast) {
        this.toast('System Synchronized', 'All views and metrics refreshed from the live database.', 'info');
      }
    },

    bindClock() {
      const clockElem = document.getElementById('live-clock');
      if (!clockElem) return;

      const update = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        clockElem.textContent = `${dateStr} • ${timeStr}`;
      };

      update();
      setInterval(update, 1000);
    },

    bindGlobalActions() {
      const refreshBtn = document.getElementById('btn-refresh-data') || document.getElementById('btn-reset-demo-data');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.refreshSystemData(true);
        });
      }
    },

    async renderDashboard() {
      if (!window.BankingApi) return;

      const kpiCust = document.getElementById('kpi-total-customers');
      const kpiAcc = document.getElementById('kpi-total-accounts');
      const kpiBal = document.getElementById('kpi-total-balance');
      const kpiTxn = document.getElementById('kpi-total-transactions');
      const accSubtext = document.getElementById('kpi-accounts-subtext');
      const recentTbody = document.getElementById('dashboard-recent-activity-tbody');

      try {
        const stats = await window.BankingApi.getDashboardStats();

        if (kpiCust) kpiCust.textContent = stats.total_customers || 0;
        if (kpiAcc) kpiAcc.textContent = stats.total_accounts || 0;
        if (kpiBal) {
          const bal = parseFloat(stats.total_balance || 0);
          kpiBal.textContent = `₹${bal.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`;
        }

        const recentList = stats.recent_transactions || [];
        if (kpiTxn) {
          kpiTxn.textContent = recentList.length > 0 ? `${recentList.length}+` : '0';
        }

        if (accSubtext) {
          accSubtext.textContent = 'Active & Closed Portfolio';
        }

        // Recent Activity Table on Dashboard
        if (recentTbody) {
          if (recentList.length === 0) {
            recentTbody.innerHTML = `
              <tr>
                <td colspan="5" class="empty-table-state" style="padding: 24px;">
                  No recent activity recorded in database.
                </td>
              </tr>
            `;
          } else {
            recentTbody.innerHTML = recentList.map(item => {
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
              const dateFmt = dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
              const timeFmt = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

              const refPrefix = item.record_type === 'Transfer' || item.type === 'Transfer' ? 'TRF' : 'TXN';
              const amt = parseFloat(item.amount || 0);

              return `
                <tr>
                  <td class="cell-mono cell-strong">#${refPrefix}-${item.id}</td>
                  <td><span class="badge ${badgeClass}">${item.type}</span></td>
                  <td class="cell-mono">${this.escape(item.account_number || item.account_info || 'N/A')}</td>
                  <td class="${amountClass}">${prefix}₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div>${dateFmt}</div>
                    <div class="cell-muted cell-mono">${timeFmt}</div>
                  </td>
                </tr>
              `;
            }).join('');
          }
        }
      } catch (err) {
        console.warn('Dashboard data fetch warning:', err.message);
        if (recentTbody) {
          recentTbody.innerHTML = `
            <tr>
              <td colspan="5" class="empty-table-state" style="padding: 24px; color: var(--amber-600);">
                Database offline or initializing. Start MySQL to view live analytics.
              </td>
            </tr>
          `;
        }
      }
    },

    // ------------------------------------------------------------------------
    // Global Modal System
    // ------------------------------------------------------------------------
    initModalListeners() {
      const overlay = document.getElementById('global-modal-overlay');
      const closeBtn = document.getElementById('modal-close-btn');

      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            this.closeModal();
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeModal();
        });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeModal();
        }
      });
    },

    openModal(title, bodyHtml, footerHtml = '') {
      const overlay = document.getElementById('global-modal-overlay');
      const titleElem = document.getElementById('modal-title');
      const bodyElem = document.getElementById('modal-body-content');
      const footerElem = document.getElementById('modal-footer-content');

      if (!overlay) return;

      if (titleElem) titleElem.textContent = title;
      if (bodyElem) bodyElem.innerHTML = bodyHtml;
      if (footerElem) footerElem.innerHTML = footerHtml;

      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    closeModal() {
      const overlay = document.getElementById('global-modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
      }
      document.body.style.overflow = '';
    },

    confirm(title, message, onConfirm) {
      const content = `
        <div style="display: flex; gap: 16px; align-items: flex-start;">
          <div style="background: #fef2f2; color: #dc2626; padding: 10px; border-radius: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <h4 style="font-weight: 700; color: var(--slate-900); margin-bottom: 6px;">${this.escape(title)}</h4>
            <p style="color: var(--slate-600); font-size: 0.92rem; line-height: 1.5;">${this.escape(message)}</p>
          </div>
        </div>
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="window.App.closeModal()">Cancel</button>
        <button class="btn btn-danger" id="modal-confirm-btn">Confirm Proceed</button>
      `;

      this.openModal(title, content, footer);

      setTimeout(() => {
        const confirmBtn = document.getElementById('modal-confirm-btn');
        if (confirmBtn) {
          confirmBtn.onclick = () => {
            this.closeModal();
            if (typeof onConfirm === 'function') {
              onConfirm();
            }
          };
        }
      }, 50);
    },

    // ------------------------------------------------------------------------
    // Toast Notification System
    // ------------------------------------------------------------------------
    toast(title, message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      const iconSvg = {
        success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
        error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
      }[type] || '';

      toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-content">
          <div class="toast-title">${this.escape(title)}</div>
          <div class="toast-message">${this.escape(message)}</div>
        </div>
        <button class="toast-close" title="Dismiss">&times;</button>
      `;

      const removeToast = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 250);
      };

      toast.querySelector('.toast-close').addEventListener('click', removeToast);

      container.appendChild(toast);
      setTimeout(removeToast, 3800);
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

  // Run on DOM Content Loaded
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });

  window.App = App;
})(window);
