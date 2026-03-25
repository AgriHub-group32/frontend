/**
 * AgriConnect API Service
 *
 * Central module for all backend API calls.
 * Uses CONFIG.API_BASE_URL from config.js (must be loaded first).
 */
const API = {
  /**
   * Core fetch wrapper with auth headers and error handling.
   */
  async request(endpoint, options = {}) {
    const url = CONFIG.API_BASE_URL + endpoint;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    const token = Auth.getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message || data?.error || 'Something went wrong';
        throw { status: res.status, message };
      }

      return data;
    } catch (err) {
      if (err.status) throw err;
      throw { status: 0, message: 'Network error. Is the server running?' };
    }
  },

  /**
   * File upload wrapper (uses FormData instead of JSON).
   */
  async uploadFiles(endpoint, fieldName, files) {
    const url = CONFIG.API_BASE_URL + endpoint;
    const formData = new FormData();
    for (const file of files) {
      formData.append(fieldName, file);
    }

    const headers = {};
    const token = Auth.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    // Do NOT set Content-Type — browser sets it with boundary for FormData

    try {
      const res = await fetch(url, { method: 'POST', headers, body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = data?.message || data?.error || 'Upload failed';
        throw { status: res.status, message };
      }
      return data;
    } catch (err) {
      if (err.status) throw err;
      throw { status: 0, message: 'Network error. Is the server running?' };
    }
  },

  // ─── AUTH ──────────────────────────────────────────
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async adminLogin(email, password) {
    return this.request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(fullName, email, password, type) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password, type }),
    });
  },

  async requestPasswordReset(email) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async confirmPasswordReset(token, newPassword) {
    return this.request('/auth/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },

  // ─── ACCOUNT ───────────────────────────────────────
  async getProfile() {
    return this.request('/account/profile');
  },

  async updateProfile(data) {
    return this.request('/account/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async changePassword(oldPassword, newPassword) {
    return this.request('/account/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  },

  async deactivateAccount() {
    return this.request('/account/deactivate', { method: 'PATCH' });
  },

  async getPublicProfile(userId) {
    return this.request('/account/profile/' + userId);
  },

  // ─── MARKETPLACE ───────────────────────────────────
  async searchMarketplace(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.location) query.set('location', params.location);
    if (params.minPrice) query.set('minPrice', params.minPrice);
    if (params.maxPrice) query.set('maxPrice', params.maxPrice);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    const qs = query.toString();
    return this.request('/marketplace' + (qs ? '?' + qs : ''));
  },

  async getTrending() {
    return this.request('/marketplace/trending');
  },

  async getListingDetail(id) {
    return this.request('/marketplace/' + id);
  },

  // ─── HARVESTS ──────────────────────────────────────
  async getMyHarvests() {
    return this.request('/harvests/mine');
  },

  async createHarvest(data) {
    return this.request('/harvests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateHarvest(id, data) {
    return this.request('/harvests/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteHarvest(id) {
    return this.request('/harvests/' + id, { method: 'DELETE' });
  },

  async getCategories() {
    return this.request('/harvests/categories');
  },

  async uploadHarvestImages(harvestId, files) {
    return this.uploadFiles('/harvests/' + harvestId + '/images', 'images', files);
  },

  async deleteHarvestImage(harvestId, imageId) {
    return this.request('/harvests/' + harvestId + '/images/' + imageId, { method: 'DELETE' });
  },

  // ─── ORDERS ────────────────────────────────────────
  async createOrder(harvestId, quantity, note) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ harvest_id: harvestId, quantity, note }),
    });
  },

  async getOrders() {
    return this.request('/orders');
  },

  async getOrderHistory() {
    return this.request('/orders/history');
  },

  async getOrder(id) {
    return this.request('/orders/' + id);
  },

  async acceptOrder(id) {
    return this.request('/orders/' + id + '/accept', { method: 'PATCH' });
  },

  async rejectOrder(id) {
    return this.request('/orders/' + id + '/reject', { method: 'PATCH' });
  },

  async completeOrder(id) {
    return this.request('/orders/' + id + '/complete', { method: 'PATCH' });
  },

  async cancelOrder(id) {
    return this.request('/orders/' + id + '/cancel', { method: 'PATCH' });
  },

  // ─── PAYMENTS ──────────────────────────────────────
  async createPayment(orderId, method) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, method }),
    });
  },

  async getPayments() {
    return this.request('/payments');
  },

  async getPayment(id) {
    return this.request('/payments/' + id);
  },

  // ─── REVIEWS ───────────────────────────────────────
  async createReview(orderId, rating, comment) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, rating, comment }),
    });
  },

  async getUserReviews(userId) {
    return this.request('/reviews/user/' + userId);
  },

  // ─── CHAT ──────────────────────────────────────────
  async getChatRooms() {
    return this.request('/chat/rooms');
  },

  async createChatRoom(userId) {
    return this.request('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  async getRoomMessages(roomId, page = 1) {
    return this.request('/chat/rooms/' + roomId + '/messages?page=' + page);
  },

  // ─── ANALYTICS ─────────────────────────────────────
  async getSalesAnalytics() {
    return this.request('/analytics/sales');
  },

  async getPopularProducts() {
    return this.request('/analytics/popular');
  },

  async getPlatformMetrics() {
    return this.request('/analytics/platform');
  },
};
