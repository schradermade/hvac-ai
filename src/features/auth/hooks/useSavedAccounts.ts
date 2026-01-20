/**
 * Hook for saved account sessions
 */

import { useCallback, useEffect, useState } from 'react';
import type { AccountSummary } from '@/lib/storage';
import { getSavedAccounts } from '@/lib/storage';

interface SavedAccountsState {
  accounts: AccountSummary[];
  isLoading: boolean;
  error: Error | null;
}

export function useSavedAccounts() {
  const [state, setState] = useState<SavedAccountsState>({
    accounts: [],
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const accounts = await getSavedAccounts();
      setState({ accounts, isLoading: false, error: null });
    } catch (error) {
      setState({ accounts: [], isLoading: false, error: error as Error });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
