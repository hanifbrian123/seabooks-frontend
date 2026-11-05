import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import VesselsPage from './pages/VesselsPage'
import CrewPage from './pages/CrewPage'

function PlaceholderPage({ title, description }) {
  return (
    <div className="bg-brand-surface rounded-2xl p-8 border border-brand-secondary shadow-xs">
      <div className="w-12 h-1.5 bg-brand-accent rounded-full mb-4" />
      <h1 className="text-2xl font-bold text-brand-navy mb-2">{title}</h1>
      <p className="text-brand-navy/70">{description}</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/trips" replace />} />
          <Route
            path="trips"
            element={
              <PlaceholderPage
                title="Trips & Accounting"
                description="Manage fishing vessel trips, fish sales income, and trip expenses with integrated crew cash advance deductions."
              />
            }
          />
          <Route path="vessels" element={<VesselsPage />} />
          <Route path="crew" element={<CrewPage />} />
          <Route
            path="kasbon"
            element={
              <PlaceholderPage
                title="Crew Cash Advances (Kasbon)"
                description="Track crew cash advance loans and repayments across trips."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
