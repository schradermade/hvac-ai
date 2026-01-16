/**
 * Auth Feature Module
 *
 * Public API for authentication feature
 */

// Export screens
export { LoginScreen } from './screens/LoginScreen';
export { SignupScreen } from './screens/SignupScreen';
export { PasswordResetScreen } from './screens/PasswordResetScreen';

// Export types
export type {
  AuthCredentials,
  SignupData,
  AuthResponse,
  AuthError,
  AuthState,
  AuthUser,
} from './types';

// Export service (for testing only - use hooks in components)
export { authService } from './services/authService';
