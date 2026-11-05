import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Compass,
  Edit2,
  Plus,
  Ship,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { tripApi, vesselApi } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'

const todayStr = () => new Date().toISOString().split('T')[0]

const TRIP_STATUSES = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ONGOING', label: 'Ongoing (Sailing)' },
  { value: 'COMPLETED', label: 'Completed' },
]

function TripStatusBadge({ status }) {
  const styles = {
    PLANNED: 'bg-amber-50 text-amber-700 border-amber-200',
    ONGOING: 'bg-brand-secondary text-brand-accent border-brand-accent/20',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  const labels = {
    PLANNED: 'Planned',
    ONGOING: 'Ongoing',
    COMPLETED: 'Completed',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
        styles[status] || 'bg-brand-secondary text-brand-navy border-brand-secondary'
      }`}
    >
      {labels[status] || status}
    </span>
  )
}

const emptyForm = {
  vesselId: '',
  departureDate: todayStr(),
  estimatedReturnDate: todayStr(),
  status: 'ONGOING',
  notes: '',
}

export default function TripsPage() {
  const [trips, setTrips] = useState([])
  const [vessels, setVessels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [tripsData, vesselsData] = await Promise.all([
        tripApi.getAll(),
        vesselApi.getAll(),
      ])
      setTrips(tripsData)
      setVessels(vesselsData)
    } catch (err) {
      setError(err.message || 'Failed to load trips')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const fleetTotals = useMemo(() => {
    return trips.reduce(
      (acc, t) => {
        const inc = Number(t.totalIncome || 0)
        const exp = Number(t.totalExpense || 0)
        return {
          income: acc.income + inc,
          expense: acc.expense + exp,
          profit: acc.profit + (inc - exp),
        }
      },
      { income: 0, expense: 0, profit: 0 },
    )
  }, [trips])

  const openCreateModal = () => {
    setEditingTrip(null)
    setFormData({
      ...emptyForm,
      vesselId: vessels[0]?.id ? String(vessels[0].id) : '',
      departureDate: todayStr(),
      estimatedReturnDate: todayStr(),
    })
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (trip) => {
    setEditingTrip(trip)
    setFormData({
      vesselId: trip.vessel?.id ? String(trip.vessel.id) : '',
      departureDate: trip.departureDate || todayStr(),
      estimatedReturnDate: trip.estimatedReturnDate || todayStr(),
      status: trip.status || 'ONGOING',
      notes: trip.notes || '',
    })
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTrip(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      const payload = {
        vesselId: Number(formData.vesselId),
        departureDate: formData.departureDate,
        estimatedReturnDate: formData.estimatedReturnDate,
        status: formData.status,
        notes: formData.notes,
      }
      if (editingTrip) {
        await tripApi.update(editingTrip.id, payload)
      } else {
        await tripApi.create(payload)
      }
      closeModal()
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to save trip')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (trip) => {
    if (
      !window.confirm(
        `Delete Trip #${trip.id} (${trip.vessel?.name})? All incomes, expenses, and linked kasbon deductions for this trip will also be reversed and removed.`,
      )
    ) {
      return
    }
    try {
      setError('')
      await tripApi.delete(trip.id)
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to delete trip')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-surface p-6 rounded-2xl border border-brand-secondary shadow-xs">
        <div>
          <div className="w-10 h-1.5 bg-brand-accent rounded-full mb-3" />
          <h1 className="text-2xl font-bold text-brand-navy">Trips & Accounting</h1>
          <p className="text-sm text-brand-navy/70 mt-1">
            Create fishing trips, record fish catch sales and operational expenses, and manage crew wage kasbon deductions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-brand-surface font-semibold text-sm hover:opacity-95 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create New Trip
        </button>
      </div>

      {/* Fleet-Wide Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-secondary shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700/80">
              All Trips Income
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {formatCurrency(fleetTotals.income)}
          </p>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-secondary shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700/80">
              All Trips Expenses
            </span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-1">
            {formatCurrency(fleetTotals.expense)}
          </p>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-secondary shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Total Net Profit
            </span>
            <Wallet className="w-4 h-4 text-brand-accent" />
          </div>
          <p
            className={`text-2xl font-bold mt-1 ${
              fleetTotals.profit >= 0 ? 'text-brand-navy' : 'text-rose-700'
            }`}
          >
            {formatCurrency(fleetTotals.profit)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Trips List */}
      {loading ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-secondary p-12 text-center text-brand-navy/60 text-sm">
          Loading trips...
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-secondary p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-secondary text-brand-accent flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-brand-navy">No trips recorded yet</h3>
          <p className="text-sm text-brand-navy/60 mt-1 mb-4">
            {vessels.length === 0
              ? 'Please add a vessel in the Vessels tab first, then create your first trip.'
              : 'Create a fishing trip to start recording fish sales and trip expenses.'}
          </p>
          {vessels.length === 0 ? (
            <Link
              to="/vessels"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold hover:opacity-95 transition"
            >
              <Ship className="w-4 h-4" />
              Go to Vessels
            </Link>
          ) : (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create First Trip
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {trips.map((trip) => {
            const netProfit = Number(trip.netProfit || 0)
            return (
              <div
                key={trip.id}
                className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xs overflow-hidden hover:border-brand-accent/40 transition"
              >
                {/* Top clickable accent bar */}
                <div className="h-1.5 bg-brand-accent w-full" />
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Vessel & Schedule */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-secondary text-brand-accent">
                          Trip #{trip.id}
                        </span>
                        <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                          <Ship className="w-4 h-4 text-brand-accent" />
                          {trip.vessel?.name || 'Unknown Vessel'}
                        </h2>
                        <TripStatusBadge status={trip.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-brand-navy/70 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                          Departure: <strong className="text-brand-navy">{formatDate(trip.departureDate)}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                          Est. Return:{' '}
                          <strong className="text-brand-navy">
                            {formatDate(trip.estimatedReturnDate)}
                          </strong>
                        </span>
                      </div>

                      {trip.notes && (
                        <p className="text-xs text-brand-navy/65 pt-0.5">{trip.notes}</p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/trips/${trip.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-xs font-bold hover:opacity-95 transition shadow-xs"
                      >
                        Manage Incomes & Expenses
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openEditModal(trip)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-secondary text-brand-navy hover:bg-brand-accent hover:text-brand-surface text-xs font-semibold transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(trip)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* 3 Financial Summary Cards inside each Trip card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-brand-secondary">
                    <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 px-4 py-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800/70">
                        Trip Income (Sales)
                      </span>
                      <p className="text-base font-bold text-emerald-700 mt-0.5">
                        {formatCurrency(trip.totalIncome)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-rose-50/70 border border-rose-200/80 px-4 py-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800/70">
                        Trip Expenses
                      </span>
                      <p className="text-base font-bold text-rose-700 mt-0.5">
                        {formatCurrency(trip.totalExpense)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-secondary/70 border border-brand-accent/20 px-4 py-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy/70">
                        Net Profit
                      </span>
                      <p
                        className={`text-base font-bold mt-0.5 ${
                          netProfit >= 0 ? 'text-brand-navy' : 'text-rose-700'
                        }`}
                      >
                        {formatCurrency(trip.netProfit)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4">
          <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-secondary">
              <h2 className="text-lg font-bold text-brand-navy">
                {editingTrip ? `Edit Trip #${editingTrip.id}` : 'Create New Trip'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-brand-navy/60 hover:bg-brand-secondary hover:text-brand-navy transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Select Vessel *
                </label>
                <select
                  required
                  value={formData.vesselId}
                  onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                >
                  <option value="" disabled>
                    Choose a vessel...
                  </option>
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.registrationNumber ? `(${v.registrationNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={(e) =>
                      setFormData({ ...formData, departureDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                    Est. Return Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.estimatedReturnDate}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedReturnDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Trip Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                >
                  {TRIP_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Fishing ground area, target catch, or operational notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-secondary">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-brand-secondary text-brand-navy text-sm font-semibold hover:opacity-90 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : editingTrip
                      ? 'Save Changes'
                      : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

