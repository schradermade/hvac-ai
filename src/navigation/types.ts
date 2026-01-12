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
  Jobs: undefined;
  Clients: undefined;
  History: undefined;
  Settings: undefined;
};

/**
 * Root Stack Navigator Param List
 * For detail screens and modals
 */
export type RootStackParamList = {
  Main: undefined;
  // Client flows
  ClientDetail: { clientId: string };
  // Equipment flows
  CreateEquipment: { clientId: string };
  EquipmentDetail: { equipmentId: string };
  // Job flows
  JobDetail: { jobId: string };
  // Diagnostic flows
  DiagnosticChat: {
    clientId: string;
    jobId?: string;
    equipmentId?: string;
    sessionId?: string; // If resuming an existing session
  };
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
