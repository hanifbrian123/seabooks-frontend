import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import VesselsPage from './pages/VesselsPage'
import CrewPage from './pages/CrewPage'
import KasbonPage from './pages/KasbonPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-sm font-medium text-brand-navy/60">
        Loading workspace...
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/trips" replace />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="trips/:id" element={<TripDetailPage />} />
            <Route path="vessels" element={<VesselsPage />} />
            <Route path="crew" element={<CrewPage />} />
            <Route path="kasbon" element={<KasbonPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
