import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { fetchStats } from './api/libraryApi';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import BookDetailsPage from './pages/BookDetailsPage';

export default function App() {
  const [stats, setStats] = useState({
    totalTitles: 0,
    totalCopies: 0,
    issuedCopies: 0,
    overdueLoans: 0,
    totalFineCollected: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const refreshStats = useCallback(async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch {
      // Errors on individual pages are surfaced via page alerts
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        {toast && (
          <div className={`toast toast--${toast.type}`} role="status">
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <main className="container main-content">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  stats={stats}
                  statsLoading={statsLoading}
                  refreshStats={refreshStats}
                  notify={notify}
                />
              }
            />
            <Route
              path="/books/:id"
              element={
                <BookDetailsPage
                  refreshStats={refreshStats}
                  notify={notify}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
