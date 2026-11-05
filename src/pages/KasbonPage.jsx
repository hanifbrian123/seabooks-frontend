import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Filter,
  Plus,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { crewApi, kasbonApi } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'

const todayStr = () => new Date().toISOString().split('T')[0]

const emptyForm = {
  crewMemberId: '',
  transactionDate: todayStr(),
  type: 'LOAN',
  amount: '',
  description: '',
}

export default function KasbonPage() {
  const [transactions, setTransactions] = useState([])
  const [crewList, setCrewList] = useState([])
  const [selectedCrewId, setSelectedCrewId] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async (crewFilter = selectedCrewId) => {
    try {
      setLoading(true)
      setError('')
      const [txData, crewData] = await Promise.all([
        kasbonApi.getAll(crewFilter || undefined),
        crewApi.getAll(),
      ])
      setTransactions(txData)
      setCrewList(crewData)
    } catch (err) {
      setError(err.message || 'Failed to load kasbon ledger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedCrewId)
  }, [selectedCrewId])

  const filteredTransactions = useMemo(() => {
    if (!selectedType) return transactions
    return transactions.filter((tx) => tx.type === selectedType)
  }, [transactions, selectedType])

  const summary = useMemo(() => {
    const totalOutstanding = crewList.reduce(
      (sum, c) => sum + Number(c.totalKasbon || 0),
      0,
    )
    const totalLoans = filteredTransactions
      .filter((t) => t.type === 'LOAN')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const totalRepayments = filteredTransactions
      .filter((t) => t.type === 'REPAYMENT')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    return { totalOutstanding, totalLoans, totalRepayments }
  }, [crewList, filteredTransactions])

  const selectedFormCrew = useMemo(() => {
    if (!formData.crewMemberId) return null
    return crewList.find((c) => String(c.id) === String(formData.crewMemberId)) || null
  }, [crewList, formData.crewMemberId])

  const openCreateModal = (defaultType = 'LOAN') => {
    setEditingTx(null)
    setFormData({
      ...emptyForm,
      type: defaultType,
      crewMemberId: selectedCrewId || (crewList[0]?.id ? String(crewList[0].id) : ''),
      transactionDate: todayStr(),
    })
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (tx) => {
    setEditingTx(tx)
    setFormData({
      crewMemberId: tx.crewMember?.id ? String(tx.crewMember.id) : '',
      transactionDate: tx.transactionDate || todayStr(),
      type: tx.type || 'LOAN',
      amount: tx.amount ?? '',
      description: tx.description || '',
    })
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTx(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      const payload = {
        crewMemberId: Number(formData.crewMemberId),
        transactionDate: formData.transactionDate,
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description,
      }
      if (editingTx) {
        await kasbonApi.update(editingTx.id, payload)
      } else {
        await kasbonApi.create(payload)
      }
      closeModal()
      await loadData(selectedCrewId)
    } catch (err) {
      setError(err.message || 'Failed to save kasbon transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (tx) => {
    if (
      !window.confirm(
        `Delete this ${tx.type} transaction (${formatCurrency(tx.amount)}) for ${tx.crewMember?.name}?`,
      )
    ) {
      return
    }
    try {
      setError('')
      await kasbonApi.delete(tx.id)
      await loadData(selectedCrewId)
    } catch (err) {
      setError(err.message || 'Failed to delete transaction')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-brand-surface p-6 rounded-2xl border border-brand-secondary shadow-xs">
        <div>
          <div className="w-10 h-1.5 bg-brand-accent rounded-full mb-3" />
          <h1 className="text-2xl font-bold text-brand-navy">
            Crew Cash Advances (Kasbon Ledger)
          </h1>
          <p className="text-sm text-brand-navy/70 mt-1">
            Record crew cash advance loans and debt repayments. Every entry automatically updates the crew member&apos;s total kasbon balance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openCreateModal('REPAYMENT')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-secondary text-brand-navy font-semibold text-sm hover:bg-brand-accent hover:text-brand-surface transition cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Record Repayment (+In)
          </button>
          <button
            onClick={() => openCreateModal('LOAN')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-brand-surface font-semibold text-sm hover:opacity-95 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Loan (Kasbon)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-secondary shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">
            Total Active Fleet Kasbon Debt
          </span>
          <p className="text-2xl font-bold text-brand-navy mt-1">
            {formatCurrency(summary.totalOutstanding)}
          </p>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-secondary shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700/80">
            Total Loans Issued (View)
          </span>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {formatCurrency(summary.totalLoans)}
          </p>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-secondary shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700/80">
            Total Repayments (+In / View)
          </span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {formatCurrency(summary.totalRepayments)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-brand-surface p-4 rounded-2xl border border-brand-secondary shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-navy/70">
          <Filter className="w-4 h-4 text-brand-accent" />
          Filter Ledger
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedCrewId}
            onChange={(e) => setSelectedCrewId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm font-medium focus:outline-none focus:border-brand-accent"
          >
            <option value="">All Crew Members</option>
            {crewList.map((crew) => (
              <option key={crew.id} value={crew.id}>
                {crew.name} — Debt: {formatCurrency(crew.totalKasbon)}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm font-medium focus:outline-none focus:border-brand-accent"
          >
            <option value="">All Transaction Types</option>
            <option value="LOAN">LOAN (New Cash Advance)</option>
            <option value="REPAYMENT">REPAYMENT (Debt Payment / Deduction)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brand-navy/60 text-sm">
            Loading kasbon transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary text-brand-accent flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">
              No kasbon transactions found
            </h3>
            <p className="text-sm text-brand-navy/60 mt-1 mb-4">
              Record a cash advance loan or a debt repayment to start tracking crew balances.
            </p>
            <button
              onClick={() => openCreateModal('LOAN')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Record First Loan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-secondary/60 border-b border-brand-secondary text-xs font-bold uppercase tracking-wider text-brand-navy/70">
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Crew Member</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-secondary text-sm">
                {filteredTransactions.map((tx) => {
                  const isLoan = tx.type === 'LOAN'
                  const isFromTrip = Boolean(tx.tripExpenseId)
                  return (
                    <tr key={tx.id} className="hover:bg-brand-bg/80 transition-colors">
                      <td className="py-4 px-6 text-brand-navy/80 whitespace-nowrap">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-brand-navy">
                          {tx.crewMember?.name || '-'}
                        </div>
                        <div className="text-xs text-brand-navy/60">
                          Current Debt: {formatCurrency(tx.crewMember?.totalKasbon)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isLoan ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              LOAN (+Debt)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              REPAYMENT (+In)
                            </span>
                          )}
                          {isFromTrip && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-secondary text-brand-accent">
                              Trip Wage Deduction
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className={`py-4 px-6 font-bold whitespace-nowrap ${
                          isLoan ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {isLoan ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-4 px-6 text-brand-navy/80 max-w-xs">
                        {tx.description || '-'}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {isFromTrip ? (
                          <span className="text-xs font-medium text-brand-navy/50 italic">
                            Synced with Trip Expense
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(tx)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-secondary text-brand-navy hover:bg-brand-accent hover:text-brand-surface text-xs font-semibold transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(tx)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Kasbon Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4">
          <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-secondary">
              <h2 className="text-lg font-bold text-brand-navy">
                {editingTx ? 'Edit Kasbon Transaction' : 'Record Kasbon Transaction'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-brand-navy/60 hover:bg-brand-secondary hover:text-brand-navy transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Transaction Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Transaction Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'LOAN' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      formData.type === 'LOAN'
                        ? 'bg-brand-accent text-brand-surface border-brand-accent'
                        : 'bg-brand-bg text-brand-navy border-brand-secondary hover:bg-brand-secondary'
                    }`}
                  >
                    LOAN (New Debt)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'REPAYMENT' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      formData.type === 'REPAYMENT'
                        ? 'bg-brand-accent text-brand-surface border-brand-accent'
                        : 'bg-brand-bg text-brand-navy border-brand-secondary hover:bg-brand-secondary'
                    }`}
                  >
                    REPAYMENT (+In / Pay Debt)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Crew Member (ABK) *
                </label>
                <select
                  required
                  value={formData.crewMemberId}
                  onChange={(e) =>
                    setFormData({ ...formData, crewMemberId: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                >
                  <option value="" disabled>
                    Select crew member...
                  </option>
                  {crewList.map((crew) => (
                    <option key={crew.id} value={crew.id}>
                      {crew.name} ({crew.role}) — Debt: {formatCurrency(crew.totalKasbon)}
                    </option>
                  ))}
                </select>
                {selectedFormCrew && (
                  <div className="mt-2 px-3 py-2 rounded-xl bg-brand-secondary/70 flex items-center justify-between text-xs">
                    <span className="text-brand-navy/80 font-medium">
                      Active Kasbon Balance:
                    </span>
                    <span className="font-bold text-brand-navy">
                      {formatCurrency(selectedFormCrew.totalKasbon)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Transaction Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.transactionDate}
                  onChange={(e) =>
                    setFormData({ ...formData, transactionDate: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80">
                    Amount (Rp) *
                  </label>
                  {formData.type === 'REPAYMENT' &&
                    selectedFormCrew &&
                    Number(selectedFormCrew.totalKasbon) > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            amount: String(selectedFormCrew.totalKasbon),
                          })
                        }
                        className="text-xs font-bold text-brand-accent hover:underline cursor-pointer"
                      >
                        Fill Full Debt ({formatCurrency(selectedFormCrew.totalKasbon)})
                      </button>
                    )}
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 500000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={
                    formData.type === 'LOAN'
                      ? 'e.g. Cash advance before departure'
                      : 'e.g. Cash debt repayment'
                  }
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
                    : editingTx
                      ? 'Save Changes'
                      : formData.type === 'LOAN'
                        ? 'Save Loan'
                        : 'Save Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
