import { useEffect } from 'react';
import type { AppState } from '../types';
import { buildUrlQuery, syncUrl } from '../utils/url';

/**
 * Sync app state to URL on configuration changes.
 * Only syncs configuration (not selection, which is transient).
 */
export function useUrlSync(state: AppState): void {
  useEffect(() => {
    const query = buildUrlQuery({
      primaryTz: state.primaryTz,
      secondaryTz: state.secondaryTz,
      coreHours: state.coreHours,
      extHours: state.extHours,
    });
    syncUrl(query);
  }, [state.primaryTz, state.secondaryTz, state.coreHours, state.extHours]);
}
