import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/Chat';
import Documents from './pages/Documents';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-center" dir="rtl" />
      </AuthProvider>
    </Router>
  );
}
