import { useEffect } from 'react';
import { AppStateProvider, useAppState } from './hooks/useAppState';
import { ThemeProvider } from './hooks/useTheme';
import { useUrlSync } from './hooks/useUrlSync';
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import SelectionPanel from './components/SelectionPanel';
import './App.css';

function AppContent() {
  const { state, setSelection } = useAppState();
  useUrlSync(state);

  // Keyboard support: Escape clears selection. Mirrors the useDragSelection
  // Escape guard: an already-handled Escape and an Escape aimed at an input /
  // textarea (the user is typing, not dragging) are owned by that input /
  // handler and clear nothing.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !state.selection) return;
      if (e.defaultPrevented) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      setSelection(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selection, setSelection]);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <CalendarGrid />
        <SelectionPanel />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </ThemeProvider>
  );
}
