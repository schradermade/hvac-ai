/**
 * Auth Provider
 *
 * Global authentication state management using React Context
 * Provides auth state and methods to all components in the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, AuthCredentials, SignupData, AuthError } from '@/features/auth/types';
import { authService } from '@/features/auth/services/authService';
import * as authStorage from '@/lib/storage';

interface AuthContextValue extends AuthState {
  // eslint-disable-next-line no-unused-vars
  login: (credentials: AuthCredentials) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start as loading while we check for stored token
    error: null,
  });

  /**
   * Initialize auth state on mount
   * Check for stored token and user data
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Check for existing auth session
   */
  async function initializeAuth() {
    try {
      const [token, user, isExpired] = await Promise.all([
        authStorage.getAuthToken(),
        authStorage.getCurrentUser(),
        authStorage.isTokenExpired(),
      ]);

      // If we have a valid token and user, restore the session
      if (token && user && !isExpired) {
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        // Token expired or missing, clear everything
        if (token || user) {
          await authStorage.clearAllAuthData();
        }

        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to restore session',
        },
      });
    }
  }

  /**
   * Login user
   */
  async function login(credentials: AuthCredentials): Promise<void> {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.login(credentials);

      // Save auth data to storage
      await Promise.all([
        authStorage.saveAuthToken(response.token),
        authStorage.saveCurrentUser(response.user),
        authStorage.saveTokenExpiry(response.expiresAt),
      ]);

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const authError = error as AuthError;
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: authError,
      });
      throw error;
    }
  }

  /**
   * Signup new user and company
   */
  async function signup(data: SignupData): Promise<void> {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.signup(data);

      // Save auth data to storage
      await Promise.all([
        authStorage.saveAuthToken(response.token),
        authStorage.saveCurrentUser(response.user),
        authStorage.saveTokenExpiry(response.expiresAt),
      ]);

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const authError = error as AuthError;
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: authError,
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async function logout(): Promise<void> {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Call logout service (might invalidate token on server)
      await authService.logout();

      // Clear all auth data from storage
      await authStorage.clearAllAuthData();

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local data
      await authStorage.clearAllAuthData();

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }

  /**
   * Clear auth error
   */
  function clearError() {
    setState((prev) => ({ ...prev, error: null }));
  }

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
