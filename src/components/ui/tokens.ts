/**
 * Design Tokens
 *
 * Central source of truth for design system values.
 * Based on design principles in docs/DESIGN_PRINCIPLES.md
 */

/**
 * Color Palette
 * Functional colors that communicate meaning
 */
export const colors = {
  // Primary Actions
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryPressed: '#1e40af',

  // Success States
  success: '#10b981',
  successLight: '#d1fae5',

  // Warning States
  warning: '#f59e0b',
  warningLight: '#fef3c7',

  // Error States
  error: '#ef4444',
  errorLight: '#fee2e2',

  // Neutral Grays
  surface: '#ffffff',
  background: '#f9fafb',
  backgroundDark: '#f3f4f6',
  border: '#e5e7eb',
  borderDark: '#d1d5db',
  disabled: '#9ca3af',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Typography
 * Font sizes, weights, and line heights
 */
export const typography = {
  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 16,
    xl: 20,
    '2xl': 24,
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    base: 1.4,
    relaxed: 1.6,
  },
} as const;

/**
 * Spacing
 * Based on 4pt grid system
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

/**
 * Border Radius
 */
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/**
 * Shadows
 * Subtle elevation for hierarchy
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

/**
 * Touch Targets
 * Minimum sizes for interactive elements
 */
export const touchTarget = {
  minHeight: 44,
  minWidth: 44,
} as const;

/**
 * Animations
 * Duration and easing for transitions
 */
export const animations = {
  duration: {
    fast: 150,
    base: 200,
    slow: 300,
  },
  // React Native uses spring animations, not CSS easing
} as const;

/**
 * Breakpoints
 * For responsive layouts (mainly web)
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
