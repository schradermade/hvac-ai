/**
 * Auth Storage
 *
 * Secure storage for authentication tokens and user data.
 * Tokens live in SecureStore; account metadata lives in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import type { AuthUser, StoredAccount } from './types';
import { StorageKeys } from './types';

interface AccountSession {
  user: AuthUser;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
}

export interface AccountSummary {
  account: StoredAccount;
  hasSession: boolean;
  isExpired: boolean;
}

const ACCOUNT_TOKEN_KEY_PREFIX = 'hvacops_account_token_';
const ACCOUNT_EXPIRY_KEY_PREFIX = 'hvacops_account_expiry_';
const ACCOUNT_REFRESH_KEY_PREFIX = 'hvacops_account_refresh_';
const ACCOUNT_REFRESH_EXPIRY_KEY_PREFIX = 'hvacops_account_refresh_expiry_';

function getAccountTokenKey(accountId: string): string {
  return `${ACCOUNT_TOKEN_KEY_PREFIX}${accountId}`;
}

function getAccountExpiryKey(accountId: string): string {
  return `${ACCOUNT_EXPIRY_KEY_PREFIX}${accountId}`;
}

function getAccountRefreshKey(accountId: string): string {
  return `${ACCOUNT_REFRESH_KEY_PREFIX}${accountId}`;
}

function getAccountRefreshExpiryKey(accountId: string): string {
  return `${ACCOUNT_REFRESH_EXPIRY_KEY_PREFIX}${accountId}`;
}

async function getAccounts(): Promise<StoredAccount[]> {
  const data = await AsyncStorage.getItem(StorageKeys.ACCOUNTS);
  if (!data) return [];
  return JSON.parse(data) as StoredAccount[];
}

async function saveAccounts(accounts: StoredAccount[]): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.ACCOUNTS, JSON.stringify(accounts));
}

async function pruneAccounts(accounts: StoredAccount[]): Promise<StoredAccount[]> {
  const sorted = [...accounts].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
  const kept = sorted.slice(0, 3);
  const removed = sorted.slice(3);

  if (removed.length > 0) {
    await Promise.all(removed.map((account) => clearAccountSession(account.id)));
  }

  return kept;
}

export async function saveAccountSession(
  user: AuthUser,
  token: string,
  expiresAt: Date,
  refreshToken: string,
  refreshExpiresAt: Date
): Promise<void> {
  try {
    await SecureStore.setItemAsync(getAccountTokenKey(user.id), token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    await SecureStore.setItemAsync(getAccountRefreshKey(user.id), refreshToken, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    await AsyncStorage.setItem(getAccountExpiryKey(user.id), expiresAt.toISOString());
    await AsyncStorage.setItem(getAccountRefreshExpiryKey(user.id), refreshExpiresAt.toISOString());

    const accounts = await getAccounts();
    const nextAccount: StoredAccount = {
      ...user,
      lastUsedAt: new Date().toISOString(),
    };
    const updated = accounts.some((account) => account.id === user.id)
      ? accounts.map((account) => (account.id === user.id ? nextAccount : account))
      : [nextAccount, ...accounts];
    const pruned = await pruneAccounts(updated);

    await Promise.all([
      saveAccounts(pruned),
      AsyncStorage.setItem(StorageKeys.ACTIVE_ACCOUNT_ID, user.id),
    ]);
  } catch (error) {
    console.error('Failed to save account session:', error);
    throw new Error('Failed to save authentication session');
  }
}

export async function getAccountSession(accountId: string): Promise<AccountSession | null> {
  try {
    const [accounts, token, refreshToken, expiry, refreshExpiry] = await Promise.all([
      getAccounts(),
      SecureStore.getItemAsync(getAccountTokenKey(accountId)),
      SecureStore.getItemAsync(getAccountRefreshKey(accountId)),
      AsyncStorage.getItem(getAccountExpiryKey(accountId)),
      AsyncStorage.getItem(getAccountRefreshExpiryKey(accountId)),
    ]);

    const account = accounts.find((item) => item.id === accountId);
    if (!account || !token || !refreshToken || !expiry || !refreshExpiry) return null;

    return {
      user: account,
      token,
      refreshToken,
      expiresAt: new Date(expiry),
      refreshExpiresAt: new Date(refreshExpiry),
    };
  } catch (error) {
    console.error('Failed to get account session:', error);
    return null;
  }
}

export async function getSavedAccounts(): Promise<AccountSummary[]> {
  try {
    const accounts = await getAccounts();
    const summaries = await Promise.all(
      accounts.map(async (account) => {
        const [token, expiry, refreshExpiry] = await Promise.all([
          SecureStore.getItemAsync(getAccountTokenKey(account.id)),
          AsyncStorage.getItem(getAccountExpiryKey(account.id)),
          AsyncStorage.getItem(getAccountRefreshExpiryKey(account.id)),
        ]);
        const expiresAt = expiry ? new Date(expiry) : null;
        const isExpired = expiresAt ? new Date() > expiresAt : true;
        const isRefreshExpired = refreshExpiry ? new Date() > new Date(refreshExpiry) : true;

        return {
          account,
          hasSession: Boolean(token) && !isRefreshExpired,
          isExpired: isExpired || isRefreshExpired,
        };
      })
    );

    return summaries.sort((a, b) => b.account.lastUsedAt.localeCompare(a.account.lastUsedAt));
  } catch (error) {
    console.error('Failed to get saved accounts:', error);
    return [];
  }
}

export async function getActiveAccountId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(StorageKeys.ACTIVE_ACCOUNT_ID);
  } catch (error) {
    console.error('Failed to get active account id:', error);
    return null;
  }
}

export async function setActiveAccountId(accountId: string | null): Promise<void> {
  try {
    if (accountId) {
      await AsyncStorage.setItem(StorageKeys.ACTIVE_ACCOUNT_ID, accountId);
    } else {
      await AsyncStorage.removeItem(StorageKeys.ACTIVE_ACCOUNT_ID);
    }
  } catch (error) {
    console.error('Failed to set active account id:', error);
    throw new Error('Failed to update active account');
  }
}

export async function getActiveAccountSession(): Promise<AccountSession | null> {
  const accountId = await getActiveAccountId();
  if (!accountId) return null;
  return getAccountSession(accountId);
}

export async function isAccountTokenExpired(accountId: string): Promise<boolean> {
  try {
    const expiry = await AsyncStorage.getItem(getAccountExpiryKey(accountId));
    const refreshExpiry = await AsyncStorage.getItem(getAccountRefreshExpiryKey(accountId));
    if (!expiry || !refreshExpiry) return true;
    return new Date() > new Date(expiry) || new Date() > new Date(refreshExpiry);
  } catch (error) {
    console.error('Failed to check account token expiry:', error);
    return true;
  }
}

export async function clearAccountSession(accountId: string): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(getAccountTokenKey(accountId)),
      SecureStore.deleteItemAsync(getAccountRefreshKey(accountId)),
      AsyncStorage.removeItem(getAccountExpiryKey(accountId)),
      AsyncStorage.removeItem(getAccountRefreshExpiryKey(accountId)),
    ]);
  } catch (error) {
    console.error('Failed to clear account session:', error);
    throw new Error('Failed to clear authentication session');
  }
}

export async function clearActiveSession(): Promise<void> {
  const accountId = await getActiveAccountId();
  if (!accountId) return;
  await Promise.all([clearAccountSession(accountId), setActiveAccountId(null)]);
}

export async function migrateLegacyAuth(): Promise<void> {
  try {
    const [token, userJson, expiry] = await Promise.all([
      AsyncStorage.getItem(StorageKeys.AUTH_TOKEN),
      AsyncStorage.getItem(StorageKeys.CURRENT_USER),
      AsyncStorage.getItem(StorageKeys.TOKEN_EXPIRY),
    ]);

    if (!token || !userJson) return;

    const user = JSON.parse(userJson) as AuthUser;
    const expiresAt = expiry ? new Date(expiry) : new Date(0);

    await saveAccountSession(user, token, expiresAt, `legacy-${user.id}`, expiresAt);

    await Promise.all([
      AsyncStorage.removeItem(StorageKeys.AUTH_TOKEN),
      AsyncStorage.removeItem(StorageKeys.CURRENT_USER),
      AsyncStorage.removeItem(StorageKeys.TOKEN_EXPIRY),
    ]);
  } catch (error) {
    console.error('Failed to migrate legacy auth data:', error);
  }
}

export async function authenticateBiometrics(promptMessage: string): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use passcode',
    });

    return result.success;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}

/**
 * Backward-compatible single-session helpers (active account only)
 */
export async function saveAuthToken(token: string): Promise<void> {
  const accountId = await getActiveAccountId();
  if (!accountId) {
    throw new Error('No active account to store token');
  }
  await SecureStore.setItemAsync(getAccountTokenKey(accountId), token);
}

export async function getAuthToken(): Promise<string | null> {
  const accountId = await getActiveAccountId();
  if (!accountId) return null;
  return SecureStore.getItemAsync(getAccountTokenKey(accountId));
}

export async function getRefreshToken(): Promise<string | null> {
  const accountId = await getActiveAccountId();
  if (!accountId) return null;
  return SecureStore.getItemAsync(getAccountRefreshKey(accountId));
}

export async function clearAuthToken(): Promise<void> {
  const accountId = await getActiveAccountId();
  if (!accountId) return;
  await SecureStore.deleteItemAsync(getAccountTokenKey(accountId));
}

export async function clearRefreshToken(): Promise<void> {
  const accountId = await getActiveAccountId();
  if (!accountId) return;
  await SecureStore.deleteItemAsync(getAccountRefreshKey(accountId));
}

export async function saveCurrentUser(user: AuthUser): Promise<void> {
  const accounts = await getAccounts();
  const nextAccount: StoredAccount = {
    ...user,
    lastUsedAt: new Date().toISOString(),
  };
  const updated = accounts.some((account) => account.id === user.id)
    ? accounts.map((account) => (account.id === user.id ? nextAccount : account))
    : [nextAccount, ...accounts];
  await saveAccounts(updated);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const accountId = await getActiveAccountId();
  if (!accountId) return null;
  const accounts = await getAccounts();
  return accounts.find((account) => account.id === accountId) ?? null;
}

export async function clearCurrentUser(): Promise<void> {
  const accountId = await getActiveAccountId();
  if (!accountId) return;
  const accounts = await getAccounts();
  const updated = accounts.filter((account) => account.id !== accountId);
  await saveAccounts(updated);
}

export async function saveTokenExpiry(expiresAt: Date): Promise<void> {
  const accountId = await getActiveAccountId();
  if (!accountId) {
    throw new Error('No active account to store expiry');
  }
  await AsyncStorage.setItem(getAccountExpiryKey(accountId), expiresAt.toISOString());
}

export async function getTokenExpiry(): Promise<Date | null> {
  const accountId = await getActiveAccountId();
  if (!accountId) return null;
  const expiry = await AsyncStorage.getItem(getAccountExpiryKey(accountId));
  return expiry ? new Date(expiry) : null;
}

export async function clearTokenExpiry(): Promise<void> {
  const accountId = await getActiveAccountId();
  if (!accountId) return;
  await AsyncStorage.removeItem(getAccountExpiryKey(accountId));
}

export async function clearAllAuthData(): Promise<void> {
  try {
    const accounts = await getAccounts();
    await Promise.all([
      ...accounts.map((account) => clearAccountSession(account.id)),
      AsyncStorage.removeItem(StorageKeys.ACCOUNTS),
      AsyncStorage.removeItem(StorageKeys.ACTIVE_ACCOUNT_ID),
    ]);
  } catch (error) {
    console.error('Failed to clear all auth data:', error);
    throw new Error('Failed to clear authentication data');
  }
}

export async function isTokenExpired(): Promise<boolean> {
  const accountId = await getActiveAccountId();
  if (!accountId) return true;
  return isAccountTokenExpired(accountId);
}
