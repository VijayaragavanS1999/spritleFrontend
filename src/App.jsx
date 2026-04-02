import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TicketsPage from './pages/TicketsPage';
import TicketDetail from './pages/TicketDetail';
import WebhooksPage from './pages/WebhooksPage';
import IntegrationsPage from './pages/IntegrationsPage';
import './styles/globals.css';

// Protected layout with sidebar
function AppLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

// HubSpot OAuth callback handler
function HubSpotCallbackHandler() {
  const [params] = useSearchParams();
  const { addToast } = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const status = params.get('hubspot');
    if (status === 'connected') {
      addToast('HubSpot connected successfully!', 'success');
      refreshUser();
    } else if (status === 'error') {
      addToast('HubSpot connection failed. Please try again.', 'error');
    }
  }, [params, addToast, refreshUser]);

  return null;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />

      <Route path="/dashboard" element={
        <AppLayout>
          <HubSpotCallbackHandler />
          <Dashboard />
        </AppLayout>
      } />
      <Route path="/tickets" element={
        <AppLayout><TicketsPage /></AppLayout>
      } />
      <Route path="/tickets/:id" element={
        <AppLayout><TicketDetail /></AppLayout>
      } />
      <Route path="/webhooks" element={
        <AppLayout><WebhooksPage /></AppLayout>
      } />
      <Route path="/integrations" element={
        <AppLayout><IntegrationsPage /></AppLayout>
      } />

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
