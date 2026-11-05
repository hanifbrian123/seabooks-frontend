import { useEffect, useState } from 'react'
import { Edit2, Plus, Ship, Trash2, X } from 'lucide-react'
import { vesselApi } from '../services/api'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active (Ready)' },
  { value: 'SAILING', label: 'Sailing (On Trip)' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SAILING: 'bg-brand-secondary text-brand-accent border-brand-accent/20',
    MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  const labels = {
    ACTIVE: 'Active',
    SAILING: 'Sailing',
    MAINTENANCE: 'Maintenance',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
        styles[status] || 'bg-brand-secondary text-brand-navy border-brand-secondary'
      }`}
    >
      {labels[status] || status}
    </span>
  )
}

const emptyForm = {
  name: '',
  registrationNumber: '',
  status: 'ACTIVE',
  notes: '',
}

export default function VesselsPage() {
  const [vessels, setVessels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVessel, setEditingVessel] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadVessels = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await vesselApi.getAll()
      setVessels(data)
    } catch (err) {
      setError(err.message || 'Failed to load vessels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVessels()
  }, [])

  const openCreateModal = () => {
    setEditingVessel(null)
    setFormData(emptyForm)
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (vessel) => {
    setEditingVessel(vessel)
    setFormData({
      name: vessel.name || '',
      registrationNumber: vessel.registrationNumber || '',
      status: vessel.status || 'ACTIVE',
      notes: vessel.notes || '',
    })
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingVessel(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      if (editingVessel) {
        await vesselApi.update(editingVessel.id, formData)
      } else {
        await vesselApi.create(formData)
      }
      closeModal()
      await loadVessels()
    } catch (err) {
      setError(err.message || 'Failed to save vessel')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (vessel) => {
    if (!window.confirm(`Delete vessel "${vessel.name}"?`)) return
    try {
      setError('')
      await vesselApi.delete(vessel.id)
      await loadVessels()
    } catch (err) {
      setError(err.message || 'Failed to delete vessel')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-surface p-6 rounded-2xl border border-brand-secondary shadow-xs">
        <div>
          <div className="w-10 h-1.5 bg-brand-accent rounded-full mb-3" />
          <h1 className="text-2xl font-bold text-brand-navy">Fleet Vessels</h1>
          <p className="text-sm text-brand-navy/70 mt-1">
            Register and manage your fishing vessels, hull numbers, and operational status.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-brand-surface font-semibold text-sm hover:opacity-95 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Vessel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Vessel List Card */}
      <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brand-navy/60 text-sm">
            Loading vessels...
          </div>
        ) : vessels.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary text-brand-accent flex items-center justify-center mx-auto mb-3">
              <Ship className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">No vessels registered yet</h3>
            <p className="text-sm text-brand-navy/60 mt-1 mb-4">
              Add your first fishing vessel to start creating trips.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Vessel
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-secondary/60 border-b border-brand-secondary text-xs font-bold uppercase tracking-wider text-brand-navy/70">
                  <th className="py-3.5 px-6">Vessel Name</th>
                  <th className="py-3.5 px-6">Registration / GT</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Notes</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-secondary text-sm">
                {vessels.map((vessel) => (
                  <tr key={vessel.id} className="hover:bg-brand-bg/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-brand-navy">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-secondary text-brand-accent flex items-center justify-center shrink-0">
                          <Ship className="w-4 h-4" />
                        </div>
                        <span>{vessel.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-brand-navy/80">
                      {vessel.registrationNumber || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={vessel.status} />
                    </td>
                    <td className="py-4 px-6 text-brand-navy/70 max-w-xs truncate">
                      {vessel.notes || '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(vessel)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-secondary text-brand-navy hover:bg-brand-accent hover:text-brand-surface text-xs font-semibold transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(vessel)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Vessel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4">
          <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-secondary">
              <h2 className="text-lg font-bold text-brand-navy">
                {editingVessel ? 'Edit Vessel' : 'Add New Vessel'}
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
                  Vessel Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. KM Samudra Jaya 01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Registration Number / GT
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationNumber: e.target.value })
                  }
                  placeholder="e.g. GT. 30 No. 124/Pa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional vessel specifications or notes..."
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
                  {submitting ? 'Saving...' : editingVessel ? 'Save Changes' : 'Create Vessel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

