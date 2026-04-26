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

    return {
      primaryTz,
      secondaryTz,
      coreHours: urlParams.coreHours || defaults.coreHours,
      extHours: urlParams.extHours || defaults.extHours,
      selection: null as TimeRange | null,
      viewDate: new Date(),
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

  const value = useMemo(
    () => ({
      state,
      setPrimaryTz,
      addSecondaryTz,
      removeSecondaryTz,
      swapTz,
      setSelection,
    }),
    [state, setPrimaryTz, addSecondaryTz, removeSecondaryTz, swapTz, setSelection]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
