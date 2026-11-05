import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import VesselsPage from './pages/VesselsPage'
import CrewPage from './pages/CrewPage'
import KasbonPage from './pages/KasbonPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/trips" replace />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/:id" element={<TripDetailPage />} />
          <Route path="vessels" element={<VesselsPage />} />
          <Route path="crew" element={<CrewPage />} />
          <Route path="kasbon" element={<KasbonPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
