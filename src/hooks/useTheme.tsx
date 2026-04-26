import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '../types';

const DEFAULT_THEME: Theme = {};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    const root = document.documentElement;
    Object.entries(newTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
