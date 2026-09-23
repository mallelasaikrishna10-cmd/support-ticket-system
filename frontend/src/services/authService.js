import api from './api';

export const authService = {
  /**
   * Register customer account
   */
  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  /**
   * Login user (customer or agent)
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Get authenticated user profile
   */
  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
