import { useEffect, useMemo, useState } from 'react'
import { Edit2, Plus, Trash2, Users, Wallet, X } from 'lucide-react'
import { crewApi } from '../services/api'
import { formatCurrency } from '../utils/formatters'

const COMMON_ROLES = [
  'Captain (Nakhoda)',
  'Chief Engineer (KKM)',
  'Fishing Master',
  'Deckhand (ABK)',
  'Cook',
  'Helper',
]

const emptyForm = {
  name: '',
  role: 'Deckhand (ABK)',
  phone: '',
  active: true,
}

export default function CrewPage() {
  const [crewList, setCrewList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCrew, setEditingCrew] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadCrew = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await crewApi.getAll()
      setCrewList(data)
    } catch (err) {
      setError(err.message || 'Failed to load crew members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCrew()
  }, [])

  const summary = useMemo(() => {
    const totalCrew = crewList.length
    const activeCrew = crewList.filter((c) => c.active).length
    const crewWithDebt = crewList.filter((c) => Number(c.totalKasbon || 0) > 0).length
    const totalKasbonPool = crewList.reduce(
      (acc, c) => acc + Number(c.totalKasbon || 0),
      0,
    )
    return { totalCrew, activeCrew, crewWithDebt, totalKasbonPool }
  }, [crewList])

  const openCreateModal = () => {
    setEditingCrew(null)
    setFormData(emptyForm)
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (crew) => {
    setEditingCrew(crew)
    setFormData({
      name: crew.name || '',
      role: crew.role || 'Deckhand (ABK)',
      phone: crew.phone || '',
      active: crew.active ?? true,
    })
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCrew(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      if (editingCrew) {
        await crewApi.update(editingCrew.id, formData)
      } else {
        await crewApi.create(formData)
      }
      closeModal()
      await loadCrew()
    } catch (err) {
      setError(err.message || 'Failed to save crew member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (crew) => {
    if (!window.confirm(`Delete crew member "${crew.name}"?`)) return
    try {
      setError('')
      await crewApi.delete(crew.id)
      await loadCrew()
    } catch (err) {
      setError(err.message || 'Failed to delete crew member')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-surface p-6 rounded-2xl border border-brand-secondary shadow-xs">
        <div>
          <div className="w-10 h-1.5 bg-brand-accent rounded-full mb-3" />
          <h1 className="text-2xl font-bold text-brand-navy">Crew Members (ABK)</h1>
          <p className="text-sm text-brand-navy/70 mt-1">
            Manage vessel crew members, roles, contact info, and active cash advance (kasbon) balances.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-brand-surface font-semibold text-sm hover:opacity-95 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Crew Member
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-secondary shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">
            Total Crew
          </span>
          <p className="text-2xl font-bold text-brand-navy mt-1">
            {summary.totalCrew}{' '}
            <span className="text-sm font-medium text-brand-navy/60">
              ({summary.activeCrew} active)
            </span>
          </p>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-secondary shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">
            Crew With Active Kasbon
          </span>
          <p className="text-2xl font-bold text-brand-accent mt-1">
            {summary.crewWithDebt}{' '}
            <span className="text-sm font-medium text-brand-navy/60">members</span>
          </p>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-secondary shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">
            Total Outstanding Kasbon
          </span>
          <p className="text-2xl font-bold text-brand-navy mt-1">
            {formatCurrency(summary.totalKasbonPool)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Crew Table */}
      <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brand-navy/60 text-sm">
            Loading crew members...
          </div>
        ) : crewList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary text-brand-accent flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">No crew members added yet</h3>
            <p className="text-sm text-brand-navy/60 mt-1 mb-4">
              Register your crew members (ABK) to track wages and cash advances.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Crew Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-secondary/60 border-b border-brand-secondary text-xs font-bold uppercase tracking-wider text-brand-navy/70">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Phone</th>
                  <th className="py-3.5 px-6">Total Kasbon (Debt)</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-secondary text-sm">
                {crewList.map((crew) => {
                  const hasDebt = Number(crew.totalKasbon || 0) > 0
                  return (
                    <tr key={crew.id} className="hover:bg-brand-bg/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-brand-navy">
                        {crew.name}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-brand-secondary text-brand-navy text-xs font-medium">
                          {crew.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-brand-navy/80">
                        {crew.phone || '-'}
                      </td>
                      <td className="py-4 px-6">
                        {hasDebt ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs">
                            <Wallet className="w-3.5 h-3.5 text-amber-600" />
                            {formatCurrency(crew.totalKasbon)}
                          </span>
                        ) : (
                          <span className="text-brand-navy/50 text-xs font-medium">
                            Rp 0 (Settled)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            crew.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {crew.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(crew)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-secondary text-brand-navy hover:bg-brand-accent hover:text-brand-surface text-xs font-semibold transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(crew)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Crew Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4">
          <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-secondary">
              <h2 className="text-lg font-bold text-brand-navy">
                {editingCrew ? 'Edit Crew Member' : 'Add Crew Member'}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Budi Santoso"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Role *
                </label>
                <input
                  type="text"
                  required
                  list="crew-roles"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Select or type role..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
                <datalist id="crew-roles">
                  {COMMON_ROLES.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0812-3456-7890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  id="crew-active"
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 accent-brand-accent rounded cursor-pointer"
                />
                <label
                  htmlFor="crew-active"
                  className="text-sm font-medium text-brand-navy cursor-pointer"
                >
                  Active crew member
                </label>
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
                  {submitting ? 'Saving...' : editingCrew ? 'Save Changes' : 'Add Crew Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
