/**
 * Authentication Service
 *
 * Handles authentication operations (login, signup, logout, token refresh)
 * Currently uses mock implementations - will be replaced with real API calls
 */

import type {
  AuthCredentials,
  SignupData,
  AuthResponse,
  PasswordResetRequest,
  PasswordResetConfirm,
  AuthError,
} from '../types';
import type { AuthUser } from '@/lib/storage';
import { getRefreshToken, getCurrentUser } from '@/lib/storage';

class AuthService {
  /**
   * Login with email and password
   * Deprecated in production (OIDC login required)
   */
  async login(_credentials: AuthCredentials): Promise<AuthResponse> {
    throw this.createError(
      'invalid_credentials',
      'Password login is disabled. Use enterprise SSO.'
    );
  }

  /**
   * Signup new company and admin user
   * Mock implementation - creates mock company and user
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    // Simulate network delay
    await this.delay(1000);

    // Mock validation
    if (!data.companyName) {
      throw this.createError('invalid_credentials', 'Company name is required');
    }

    if (!data.email || !data.password) {
      throw this.createError('invalid_credentials', 'Email and password are required');
    }

    if (!data.firstName || !data.lastName) {
      throw this.createError('invalid_credentials', 'First and last name are required');
    }

    // Check if email already exists (mock check)
    if (data.email === 'taken@example.com') {
      throw this.createError('email_already_exists', 'This email is already registered');
    }

    // Create mock company and admin user
    const companyId = 'company_' + Date.now();

    const mockUser: AuthUser = {
      id: 'user_' + Date.now(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      companyId,
      role: 'admin', // First user is always admin
    };

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return {
      token: this.generateMockToken(),
      refreshToken: this.generateMockToken(),
      user: mockUser,
      expiresAt,
      refreshExpiresAt: expiresAt,
    };
  }

  /**
   * Logout current user
   * Clears local auth data
   */
  async logout(): Promise<void> {
    const authUrl = process.env.EXPO_PUBLIC_AUTH_URL;
    const refreshToken = await getRefreshToken();

    if (!authUrl || !refreshToken) {
      return;
    }

    await fetch(`${authUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  /**
   * Refresh authentication token
   * Mock implementation - generates new token
   */
  async refreshToken(): Promise<AuthResponse> {
    const authUrl = process.env.EXPO_PUBLIC_AUTH_URL;
    const refreshToken = await getRefreshToken();

    if (!authUrl || !refreshToken) {
      throw this.createError('token_expired', 'Refresh token unavailable');
    }

    const response = await fetch(`${authUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw this.createError('token_expired', message || 'Refresh failed');
    }

    const payload = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      refresh_expires_at: string;
    };

    const expiresAt = new Date(Date.now() + payload.expires_in * 1000);

    const currentUser = (await getCurrentUser()) ?? {
      id: 'unknown',
      email: 'unknown@example.com',
      firstName: 'Unknown',
      lastName: 'User',
      companyId: 'unknown',
      role: 'technician',
    };

    return {
      token: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt,
      refreshExpiresAt: new Date(payload.refresh_expires_at),
      user: currentUser,
    };
  }

  /**
   * Request password reset email
   * Mock implementation - always succeeds
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    // Simulate network delay
    await this.delay(800);

    if (!request.email) {
      throw this.createError('invalid_credentials', 'Email is required');
    }

    // Mock: Check if email exists
    if (request.email === 'notfound@example.com') {
      throw this.createError('user_not_found', 'No user found with this email');
    }

    // In production, this would send an email with reset link
    // For MVP, just succeed
  }

  /**
   * Reset password with token
   * Mock implementation - validates token format
   */
  async resetPassword(confirm: PasswordResetConfirm): Promise<void> {
    // Simulate network delay
    await this.delay(800);

    if (!confirm.token || !confirm.newPassword) {
      throw this.createError('invalid_credentials', 'Token and new password are required');
    }

    // Mock token validation
    if (confirm.token === 'invalid' || confirm.token.length < 10) {
      throw this.createError('invalid_token', 'Invalid or expired reset token');
    }

    // In production, this would verify the token and update the password
    // For MVP, just succeed
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<AuthResponse> {
    const authUrl = process.env.EXPO_PUBLIC_AUTH_URL;
    if (!authUrl) {
      throw this.createError('network_error', 'Auth service not configured');
    }

    const response = await fetch(`${authUrl}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw this.createError('invalid_credentials', message || 'Auth exchange failed');
    }

    const payload = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      refresh_expires_at: string;
      user: {
        id: string;
        email: string;
        name: string;
        role: AuthUser['role'];
        tenantId: string;
      };
    };

    const expiresAt = new Date(Date.now() + payload.expires_in * 1000);
    const [firstName, ...lastNameParts] = payload.user.name.trim().split(/\s+/);
    const lastName = lastNameParts.join(' ') || 'User';
    const mappedUser: AuthUser = {
      id: payload.user.id,
      email: payload.user.email,
      firstName: firstName || 'Unknown',
      lastName,
      companyId: payload.user.tenantId,
      role: payload.user.role,
    };

    return {
      token: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt,
      refreshExpiresAt: new Date(payload.refresh_expires_at),
      user: mappedUser,
    };
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true };
  }

  /**
   * Generate mock JWT token
   */
  private generateMockToken(): string {
    const payload = btoa(
      JSON.stringify({
        sub: 'user_' + Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      })
    );

    return `mock.${payload}.signature`;
  }

  /**
   * Create authentication error
   */
  private createError(type: AuthError['type'], message: string): AuthError {
    return {
      type,
      message,
    };
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const authService = new AuthService();
