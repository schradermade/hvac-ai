/**
 * Navigation Types
 *
 * Type-safe navigation for the app.
 * Defines all routes and their parameters.
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Root Tab Navigator Param List
 */
export type RootTabParamList = {
  Diagnostics: undefined;
  Equipment: undefined;
  History: undefined;
  Settings: undefined;
};

/**
 * Root Stack Navigator Param List
 * For future modal screens, etc.
 */
export type RootStackParamList = {
  Main: undefined;
  // Future: EquipmentDetails: { equipmentId: string };
};

/**
 * Props for tab screens
 */
export type TabScreenProps<T extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * Navigation type helpers
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
