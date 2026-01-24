/**
 * Storage Type Definitions
 *
 * Type definitions for secure storage operations
 */

/**
 * Authenticated user information stored in AsyncStorage
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  role: 'admin' | 'lead_tech' | 'technician' | 'office_staff';
}

/**
 * Account metadata stored for quick login
 */
export interface StoredAccount extends AuthUser {
  lastUsedAt: string;
}

/**
 * Storage keys for AsyncStorage
 */
export enum StorageKeys {
  AUTH_TOKEN = '@hvacops:auth_token',
  CURRENT_USER = '@hvacops:current_user',
  TOKEN_EXPIRY = '@hvacops:token_expiry',
  ACCOUNTS = '@hvacops:accounts',
  ACTIVE_ACCOUNT_ID = '@hvacops:active_account_id',
}
