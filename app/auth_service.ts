/**
 * auth_service.ts - Authentication service using JWT backend
 * Replaces Firebase authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token storage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: string;
  is_verified?: boolean;
  has_passkey?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

class AuthService {
  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Save auth data
  private saveAuth(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Clear auth data
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ==================================
  // REGISTER WITH OTP
  // ==================================

  async registerRequestOTP(
    username: string,
    email: string,
    display_name: string,
    password: string,
    avatar_url?: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        display_name,
        password,
        avatar_url,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to request OTP');
    }

    return response.json();
  }

  async registerConfirm(
    email: string,
    otp: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to confirm registration');
    }

    const result: AuthResponse = await response.json();
    this.saveAuth(result.access_token, result.user);
    return result;
  }

  // ==================================
  // LOGIN
  // ==================================

  async login(username_or_email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Invalid credentials');
    }

    const result: AuthResponse = await response.json();
    this.saveAuth(result.access_token, result.user);
    return result;
  }

  // ==================================
  // LOGOUT
  // ==================================

  logout() {
    this.clearAuth();
  }

  // ==================================
  // GET CURRENT USER
  // ==================================

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuth();
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get user info');
    }

    const user: User = await response.json();
    // Update stored user
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  // ==================================
  // PASSWORD RESET
  // ==================================

  async passwordResetRequestOTP(username_or_email: string): Promise<{ message: string; email?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/password/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to request password reset OTP');
    }

    return response.json();
  }

  async passwordResetConfirm(
    email: string,
    otp: string,
    new_password: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/password/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, new_password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reset password');
    }

    return response.json();
  }

  // ==================================
  // PASSKEY MANAGEMENT
  // ==================================

  async passkeyRequestOTP(): Promise<{ message: string }> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/auth/passkey/request-otp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to request passkey OTP');
    }

    return response.json();
  }

  async passkeyConfirm(
    otp: string,
    new_passkey: string
  ): Promise<{ message: string }> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/auth/passkey/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otp, new_passkey }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update passkey');
    }

    return response.json();
  }

  // ==================================
  // PROFILE MANAGEMENT
  // ==================================

  async updateProfile(data: {
    display_name?: string;
    avatar_url?: string;
  }): Promise<{ message: string; user: User }> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update profile');
    }

    const result = await response.json();
    // Update stored user
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    return result;
  }

  async uploadAvatar(file: File): Promise<{ message: string; avatar_url: string }> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload avatar');
    }

    const result = await response.json();
    
    // Update user avatar in storage
    const user = this.getUser();
    if (user) {
      user.avatar_url = result.avatar_url;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    return result;
  }

  async deleteAvatar(): Promise<{ message: string }> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete avatar');
    }

    // Update user avatar in storage
    const user = this.getUser();
    if (user) {
      user.avatar_url = undefined;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    return response.json();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
