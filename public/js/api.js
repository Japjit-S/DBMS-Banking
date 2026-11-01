/**
 * Banking Management System - Centralized REST API Client
 * Interacts directly with the Express backend (/api/*) over HTTP.
 */

(function (window) {
  const BASE_URL = '/api';

  class ApiError extends Error {
    constructor(message, status, data = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      let payload = null;

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        const text = await response.text();
        payload = { success: response.ok, message: text };
      }

      if (!response.ok || (payload && payload.success === false)) {
        const errorMsg = (payload && payload.message) || `HTTP error ${response.status}: ${response.statusText}`;
        throw new ApiError(errorMsg, response.status, payload);
      }

      return payload && payload.data !== undefined ? payload.data : payload;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err.message || 'Network communication failure', 0, null);
    }
  }

  const BankingApi = {
    // ------------------------------------------------------------------------
    // Dashboard Endpoints
    // ------------------------------------------------------------------------
    async getDashboardStats() {
      return await request('/dashboard/stats');
    },

    // ------------------------------------------------------------------------
    // Branches Endpoints
    // ------------------------------------------------------------------------
    async getBranches() {
      return await request('/branches');
    },

    // ------------------------------------------------------------------------
    // Customers Endpoints
    // ------------------------------------------------------------------------
    async getCustomers(search = '') {
      const query = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      return await request(`/customers${query}`);
    },

    async getCustomerById(id) {
      return await request(`/customers/${encodeURIComponent(id)}`);
    },

    async createCustomer(data) {
      return await request('/customers', {
        method: 'POST',
        body: data
      });
    },

    async updateCustomer(id, data) {
      return await request(`/customers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: data
      });
    },

    async deleteCustomer(id) {
      return await request(`/customers/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    },

    // ------------------------------------------------------------------------
    // Accounts Endpoints
    // ------------------------------------------------------------------------
    async getAccounts(search = '', status = '') {
      const params = new URLSearchParams();
      if (search && search.trim()) params.append('search', search.trim());
      if (status && status.trim() && status !== 'ALL') params.append('status', status.trim());
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return await request(`/accounts${queryStr}`);
    },

    async getAccountById(id) {
      return await request(`/accounts/${encodeURIComponent(id)}`);
    },

    async openAccount(data) {
      return await request('/accounts', {
        method: 'POST',
        body: data
      });
    },

    async updateAccountStatus(id, status) {
      return await request(`/accounts/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: { status }
      });
    },

    // ------------------------------------------------------------------------
    // Transactions & Transfers Endpoints
    // ------------------------------------------------------------------------
    async deposit(accountId, amount, description = '') {
      return await request('/transactions/deposit', {
        method: 'POST',
        body: {
          account_id: accountId,
          amount,
          description
        }
      });
    },

    async withdraw(accountId, amount, description = '') {
      return await request('/transactions/withdraw', {
        method: 'POST',
        body: {
          account_id: accountId,
          amount,
          description
        }
      });
    },

    async transfer(fromAccountId, toAccountId, amount, description = '') {
      return await request('/transactions/transfer', {
        method: 'POST',
        body: {
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount,
          description
        }
      });
    },

    async getTransactionHistory(accountId = null, limit = 50) {
      const params = new URLSearchParams();
      if (accountId) params.append('account_id', accountId);
      if (limit) params.append('limit', limit);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return await request(`/transactions/history${queryStr}`);
    }
  };

  // Expose globally
  window.BankingApi = BankingApi;
  window.api = BankingApi;
})(window);
