/**
 * Banking Management System - Master Application Orchestrator
 * Coordinates Navigation, Dashboard Metrics, Modal Dialogs, and Toasts.
 */

(function (window) {
  const App = {
    currentView: 'dashboard',

    init() {
      this.bindNavigation();
      this.bindClock();
      this.bindStoreUpdates();
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

    bindStoreUpdates() {
      window.addEventListener('bank-store-updated', () => {
        // Automatically sync whichever view is currently active + refresh dashboard widgets
        this.renderDashboard();
        if (window.CustomerView) window.CustomerView.render();
        if (window.AccountView) window.AccountView.render();
        if (window.TransactionView) {
          window.TransactionView.populateAccountSelects();
          window.TransactionView.renderHistory();
        }
      });
    },

    bindGlobalActions() {
      const resetBtn = document.getElementById('btn-reset-demo-data');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.confirm(
            'Reset Demo Database?',
            'This will clear all custom edits and restore original seed records for customers, accounts, and transactions.',
            () => {
              window.BankingStore.resetToDefaults();
              this.toast('Database Reset', 'Sample relational state restored successfully.', 'info');
            }
          );
        });
      }
    },

    renderDashboard() {
      if (!window.BankingStore) return;
      const metrics = window.BankingStore.getDashboardMetrics();

      // KPI Metric Cards
      const kpiCust = document.getElementById('kpi-total-customers');
      const kpiAcc = document.getElementById('kpi-total-accounts');
      const kpiBal = document.getElementById('kpi-total-balance');
      const kpiTxn = document.getElementById('kpi-total-transactions');

      if (kpiCust) kpiCust.textContent = metrics.totalCustomers;
      if (kpiAcc) kpiAcc.textContent = metrics.totalAccounts;
      if (kpiBal) {
        kpiBal.textContent = `₹${metrics.totalBalance.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      }
      if (kpiTxn) kpiTxn.textContent = metrics.totalTransactions;

      const accSubtext = document.getElementById('kpi-accounts-subtext');
      if (accSubtext) {
        accSubtext.textContent = `${metrics.activeAccounts} Active • ${metrics.closedAccounts} Closed`;
      }

      // Recent Activity Table on Dashboard
      const recentTbody = document.getElementById('dashboard-recent-activity-tbody');
      if (recentTbody) {
        if (!metrics.recentActivity || metrics.recentActivity.length === 0) {
          recentTbody.innerHTML = `
            <tr>
              <td colspan="5" class="empty-table-state" style="padding: 24px;">
                No recent activity recorded.
              </td>
            </tr>
          `;
        } else {
          recentTbody.innerHTML = metrics.recentActivity.map(item => {
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

            const dt = new Date(item.date);
            const dateFmt = dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            const timeFmt = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            return `
              <tr>
                <td class="cell-mono cell-strong">${item.id}</td>
                <td><span class="badge ${badgeClass}">${item.type}</span></td>
                <td class="cell-mono">${item.accountNumber}</td>
                <td class="${amountClass}">${prefix}₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>
                  <div>${dateFmt}</div>
                  <div class="cell-muted cell-mono">${timeFmt}</div>
                </td>
              </tr>
            `;
          }).join('');
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
            <h4 style="font-weight: 700; color: var(--slate-900); margin-bottom: 6px;">${title}</h4>
            <p style="color: var(--slate-600); font-size: 0.92rem; line-height: 1.5;">${message}</p>
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
          <div class="toast-title">${title}</div>
          <div class="toast-message">${message}</div>
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
    }
  };

  // Run on DOM Content Loaded
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });

  window.App = App;
})(window);
