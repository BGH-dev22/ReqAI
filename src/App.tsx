import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/Landing';
import { ChatPage } from '@/pages/Chat';
import { ExportPage } from '@/pages/Export';
import { TestsPage } from '@/pages/Tests';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { DocumentProvider } from '@/context/DocumentContext';
import { AuthProvider } from '@/context/AuthContext';
import { ConversationProvider } from '@/context/ConversationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConversationProvider>
        <DocumentProvider>
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Page d'accueil / Landing - Introduction de l'app (publique) */}
            <Route path="/" element={<LandingPage />} />

            {/* Route Chat - Interface principale unifiée */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Route Export */}
            <Route
              path="/export"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ExportPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Route Tests - Génération de tests, FMEA, Conformité */}
            <Route
              path="/tests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TestsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DocumentProvider>
        </ConversationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
