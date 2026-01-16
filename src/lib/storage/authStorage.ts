/**
 * Auth Storage
 *
 * Secure storage for authentication tokens and user data using AsyncStorage
 * Provides methods for storing and retrieving auth credentials
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from './types';
import { StorageKeys } from './types';

/**
 * Save authentication token to secure storage
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Failed to save auth token:', error);
    throw new Error('Failed to save authentication token');
  }
}

/**
 * Get authentication token from secure storage
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(StorageKeys.AUTH_TOKEN);
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Remove authentication token from secure storage
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(StorageKeys.AUTH_TOKEN);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
    throw new Error('Failed to clear authentication token');
  }
}

/**
 * Save current user data to storage
 */
export async function saveCurrentUser(user: AuthUser): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save current user:', error);
    throw new Error('Failed to save user data');
  }
}

/**
 * Get current user data from storage
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const userJson = await AsyncStorage.getItem(StorageKeys.CURRENT_USER);
    if (!userJson) return null;
    return JSON.parse(userJson) as AuthUser;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Remove current user data from storage
 */
export async function clearCurrentUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(StorageKeys.CURRENT_USER);
  } catch (error) {
    console.error('Failed to clear current user:', error);
    throw new Error('Failed to clear user data');
  }
}

/**
 * Save token expiry timestamp
 */
export async function saveTokenExpiry(expiresAt: Date): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.TOKEN_EXPIRY, expiresAt.toISOString());
  } catch (error) {
    console.error('Failed to save token expiry:', error);
    throw new Error('Failed to save token expiry');
  }
}

/**
 * Get token expiry timestamp
 */
export async function getTokenExpiry(): Promise<Date | null> {
  try {
    const expiry = await AsyncStorage.getItem(StorageKeys.TOKEN_EXPIRY);
    if (!expiry) return null;
    return new Date(expiry);
  } catch (error) {
    console.error('Failed to get token expiry:', error);
    return null;
  }
}

/**
 * Clear token expiry timestamp
 */
export async function clearTokenExpiry(): Promise<void> {
  try {
    await AsyncStorage.removeItem(StorageKeys.TOKEN_EXPIRY);
  } catch (error) {
    console.error('Failed to clear token expiry:', error);
    throw new Error('Failed to clear token expiry');
  }
}

/**
 * Clear all auth data from storage
 */
export async function clearAllAuthData(): Promise<void> {
  try {
    await Promise.all([clearAuthToken(), clearCurrentUser(), clearTokenExpiry()]);
  } catch (error) {
    console.error('Failed to clear all auth data:', error);
    throw new Error('Failed to clear authentication data');
  }
}

/**
 * Check if token is expired
 */
export async function isTokenExpired(): Promise<boolean> {
  try {
    const expiry = await getTokenExpiry();
    if (!expiry) return true;
    return new Date() > expiry;
  } catch (error) {
    console.error('Failed to check token expiry:', error);
    return true; // Assume expired on error
  }
}
