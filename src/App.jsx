import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { SettingsProvider } from './context/SettingsContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { BottomNav } from './components/BottomNav';
import { Lock } from './pages/Lock';
import { Home } from './pages/Home';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

function AppShell() {
  return (
    <SettingsProvider>
      <CategoriesProvider>
        <div className="mx-auto h-full max-w-lg">
          <OfflineBanner />
          <main className="h-full overflow-y-auto scrollbar-none">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <BottomNav />
        </div>
      </CategoriesProvider>
    </SettingsProvider>
  );
}

function Gate() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-4xl animate-pulse">💰</p>
      </div>
    );
  }

  if (status === 'needsSetup' || status === 'locked') {
    return <Lock />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <NetworkProvider>
        <AuthProvider>
          <HashRouter>
            <Gate />
          </HashRouter>
        </AuthProvider>
      </NetworkProvider>
    </ErrorBoundary>
  );
}
