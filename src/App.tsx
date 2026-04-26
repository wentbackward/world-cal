import { AppStateProvider, useAppState } from './hooks/useAppState';
import { ThemeProvider } from './hooks/useTheme';
import { useUrlSync } from './hooks/useUrlSync';
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import SelectionPanel from './components/SelectionPanel';
import './App.css';

function AppContent() {
  const { state } = useAppState();
  useUrlSync(state);

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
