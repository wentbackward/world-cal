import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { AppState, TimeRange } from '../types';
import { parseUrlParams, getDefaultConfig } from '../utils/url';

interface AppStateContextValue {
  state: AppState;
  setPrimaryTz: (tz: string) => void;
  addSecondaryTz: (tz: string) => void;
  removeSecondaryTz: (tz: string) => void;
  swapTz: (tz: string) => void;
  setSelection: (selection: TimeRange | null) => void;
  setViewDate: (date: Date) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => {
    const urlParams = parseUrlParams(window.location.search);
    const defaults = getDefaultConfig();

    const primaryTz = urlParams.primaryTz || defaults.primaryTz;
    const secondaryTz = urlParams.secondaryTz?.length
      ? urlParams.secondaryTz
      : defaults.secondaryTz.filter((tz) => tz !== primaryTz);

    // If the URL carries a selection, open on the day that contains it (in the primary tz).
    const selection = urlParams.selection ?? null;
    let viewDate = new Date();
    if (selection) {
      const [y, m, d] = selection.start
        .toLocaleDateString('en-CA', { timeZone: primaryTz })
        .split('-')
        .map(Number);
      if (y && m && d) viewDate = new Date(y, m - 1, d);
    }

    return {
      primaryTz,
      secondaryTz,
      coreHours: urlParams.coreHours || defaults.coreHours,
      extHours: urlParams.extHours || defaults.extHours,
      selection,
      viewDate,
    };
  }, []);

  const [state, setState] = useState<AppState>(config);

  const setPrimaryTz = useCallback((tz: string) => {
    setState((prev) => ({
      ...prev,
      primaryTz: tz,
      secondaryTz: prev.secondaryTz.filter((t) => t !== tz),
    }));
  }, []);

  const addSecondaryTz = useCallback((tz: string) => {
    setState((prev) => ({
      ...prev,
      secondaryTz: prev.secondaryTz.includes(tz) ? prev.secondaryTz : [...prev.secondaryTz, tz],
    }));
  }, []);

  const removeSecondaryTz = useCallback((tz: string) => {
    setState((prev) => ({
      ...prev,
      secondaryTz: prev.secondaryTz.filter((t) => t !== tz),
    }));
  }, []);

  const swapTz = useCallback((tz: string) => {
    setState((prev) => {
      if (prev.primaryTz === tz) return prev;
      return {
        ...prev,
        primaryTz: tz,
        secondaryTz: [...prev.secondaryTz.filter((t) => t !== tz), prev.primaryTz],
      };
    });
  }, []);

  const setSelection = useCallback((selection: TimeRange | null) => {
    setState((prev) => ({ ...prev, selection }));
  }, []);

  const setViewDate = useCallback((date: Date) => {
    setState((prev) => ({ ...prev, viewDate: date, selection: null }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      setPrimaryTz,
      addSecondaryTz,
      removeSecondaryTz,
      swapTz,
      setSelection,
      setViewDate,
    }),
    [state, setPrimaryTz, addSecondaryTz, removeSecondaryTz, swapTz, setSelection, setViewDate]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
