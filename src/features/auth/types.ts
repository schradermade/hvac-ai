/**
 * Authentication Types
 *
 * Type definitions for authentication feature
 */

import type { AuthUser } from '@/lib/storage';

/**
 * Login credentials
 */
export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Signup form data
 */
export interface SignupData {
  // Company info
  companyName: string;
  companyPhone: string;
  companyEmail: string;

  // Admin user info
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/**
 * Authentication response from server
 */
export interface AuthResponse {
  token: string;
  user: AuthUser;
  expiresAt: Date;
}

/**
 * Auth error types
 */
export type AuthErrorType =
  | 'invalid_credentials'
  | 'user_not_found'
  | 'email_already_exists'
  | 'invalid_token'
  | 'token_expired'
  | 'network_error'
  | 'unknown_error';

/**
 * Authentication error
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: unknown;
}

/**
 * Auth state for context
 */
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

/**
 * Re-export AuthUser for convenience
 */
export type { AuthUser };
