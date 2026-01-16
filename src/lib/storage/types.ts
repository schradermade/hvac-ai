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
 * Storage keys for AsyncStorage
 */
export enum StorageKeys {
  // eslint-disable-next-line no-unused-vars
  AUTH_TOKEN = '@hvacops:auth_token',
  // eslint-disable-next-line no-unused-vars
  CURRENT_USER = '@hvacops:current_user',
  // eslint-disable-next-line no-unused-vars
  TOKEN_EXPIRY = '@hvacops:token_expiry',
}
