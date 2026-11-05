import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit2,
  Plus,
  Receipt,
  Ship,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react'
import { crewApi, tripApi } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'

const todayStr = () => new Date().toISOString().split('T')[0]

const EXPENSE_CATEGORIES = [
  { value: 'TRIP_CAPITAL', label: 'Trip Capital (Fuel, Ice & Supplies)' },
  { value: 'CREW_WAGE', label: 'Crew Wage (ABK Salary)' },
  { value: 'WORKER_WAGE', label: 'Worker Wage (Unloading / Port Labor)' },
  { value: 'VESSEL_MAINTENANCE', label: 'Vessel Repair & Maintenance' },
  { value: 'PORT_OPERATIONS', label: 'Port & Permit Operations' },
  { value: 'OTHER', label: 'Other Expenses' },
]

const CATEGORY_LABELS = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label]),
)

const emptyIncomeForm = {
  transactionDate: todayStr(),
  description: '',
  amount: '',
}

const emptyExpenseForm = {
  transactionDate: todayStr(),
  category: 'CREW_WAGE',
  amount: '',
  description: '',
  hasKasbonDeduction: false,
  crewMemberId: '',
  kasbonDeductionAmount: '',
}

export default function TripDetailPage() {
  const { id } = useParams()
  const tripId = Number(id)

  const [trip, setTrip] = useState(null)
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [crewList, setCrewList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')

  // Income Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [incomeForm, setIncomeForm] = useState(emptyIncomeForm)
  const [submittingIncome, setSubmittingIncome] = useState(false)

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm)
  const [submittingExpense, setSubmittingExpense] = useState(false)

  const loadTripDetails = async () => {
    try {
      setLoading(true)
      setError('')
      const [tripData, incomesData, expensesData, allCrew] = await Promise.all([
        tripApi.getById(tripId),
        tripApi.getIncomes(tripId),
        tripApi.getExpenses(tripId),
        crewApi.getAll(),
      ])
      setTrip(tripData)
      setIncomes(incomesData)
      setExpenses(expensesData)
      setCrewList(allCrew)
    } catch (err) {
      setError(err.message || 'Failed to load trip details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTripDetails()
  }, [tripId])

  // Compute crew members eligible for kasbon deduction
  // When editing an expense that already deducted kasbon from a crew member,
  // add back that expense's previous deduction to show their true available debt before this expense.
  const indebtedCrewOptions = useMemo(() => {
    return crewList
      .map((crew) => {
        const currentDebt = Number(crew.totalKasbon || 0)
        const priorDeductionOnThisExpense =
          editingExpense &&
          editingExpense.hasKasbonDeduction &&
          editingExpense.crewMember?.id === crew.id
            ? Number(editingExpense.kasbonDeductionAmount || 0)
            : 0
        const availableDebt = currentDebt + priorDeductionOnThisExpense
        return {
          ...crew,
          availableDebt,
        }
      })
      .filter((crew) => crew.availableDebt > 0)
  }, [crewList, editingExpense])

  const selectedExpenseCrew = useMemo(() => {
    if (!expenseForm.crewMemberId) return null
    return (
      indebtedCrewOptions.find(
        (c) => String(c.id) === String(expenseForm.crewMemberId),
      ) || null
    )
  }, [indebtedCrewOptions, expenseForm.crewMemberId])

  // Live salary & kasbon deduction breakdown calculation
  const expenseBreakdown = useMemo(() => {
    const grossAmount = Number(expenseForm.amount || 0)
    const deduction = expenseForm.hasKasbonDeduction
      ? Number(expenseForm.kasbonDeductionAmount || 0)
      : 0
    const netReceived = Math.max(0, grossAmount - deduction)
    const availableDebt = selectedExpenseCrew?.availableDebt || 0
    const remainingDebtAfter = Math.max(0, availableDebt - deduction)
    const isDeductionOverGross = deduction > grossAmount && grossAmount > 0
    const isDeductionOverDebt =
      selectedExpenseCrew && deduction > availableDebt

    return {
      grossAmount,
      deduction,
      netReceived,
      availableDebt,
      remainingDebtAfter,
      isDeductionOverGross,
      isDeductionOverDebt,
    }
  }, [expenseForm, selectedExpenseCrew])

  // --- Income Modal Handlers ---
  const openCreateIncomeModal = () => {
    setEditingIncome(null)
    setIncomeForm({
      ...emptyIncomeForm,
      transactionDate: trip?.estimatedReturnDate || todayStr(),
    })
    setError('')
    setIsIncomeModalOpen(true)
  }

  const openEditIncomeModal = (inc) => {
    setEditingIncome(inc)
    setIncomeForm({
      transactionDate: inc.transactionDate || todayStr(),
      description: inc.description || '',
      amount: inc.amount ?? '',
    })
    setError('')
    setIsIncomeModalOpen(true)
  }

  const closeIncomeModal = () => {
    setIsIncomeModalOpen(false)
    setEditingIncome(null)
    setIncomeForm(emptyIncomeForm)
  }

  const handleIncomeSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmittingIncome(true)
      setError('')
      const payload = {
        transactionDate: incomeForm.transactionDate,
        description: incomeForm.description,
        amount: Number(incomeForm.amount),
      }
      if (editingIncome) {
        await tripApi.updateIncome(tripId, editingIncome.id, payload)
      } else {
        await tripApi.createIncome(tripId, payload)
      }
      closeIncomeModal()
      await loadTripDetails()
    } catch (err) {
      setError(err.message || 'Failed to save income')
    } finally {
      setSubmittingIncome(false)
    }
  }

  const handleDeleteIncome = async (inc) => {
    if (
      !window.confirm(
        `Delete income "${inc.description}" (${formatCurrency(inc.amount)})?`,
      )
    ) {
      return
    }
    try {
      setError('')
      await tripApi.deleteIncome(tripId, inc.id)
      await loadTripDetails()
    } catch (err) {
      setError(err.message || 'Failed to delete income')
    }
  }

  // --- Expense Modal Handlers ---
  const openCreateExpenseModal = () => {
    setEditingExpense(null)
    setExpenseForm({
      ...emptyExpenseForm,
      transactionDate: trip?.departureDate || todayStr(),
    })
    setError('')
    setIsExpenseModalOpen(true)
  }

  const openEditExpenseModal = (exp) => {
    setEditingExpense(exp)
    setExpenseForm({
      transactionDate: exp.transactionDate || todayStr(),
      category: exp.category || 'CREW_WAGE',
      amount: exp.amount ?? '',
      description: exp.description || '',
      hasKasbonDeduction: Boolean(exp.hasKasbonDeduction),
      crewMemberId: exp.crewMember?.id ? String(exp.crewMember.id) : '',
      kasbonDeductionAmount:
        exp.hasKasbonDeduction && exp.kasbonDeductionAmount
          ? String(exp.kasbonDeductionAmount)
          : '',
    })
    setError('')
    setIsExpenseModalOpen(true)
  }

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false)
    setEditingExpense(null)
    setExpenseForm(emptyExpenseForm)
  }

  // Handle toggling the Kasbon Deduction checkbox
  const handleToggleKasbonDeduction = (checked) => {
    if (!checked) {
      setExpenseForm({
        ...expenseForm,
        hasKasbonDeduction: false,
        crewMemberId: '',
        kasbonDeductionAmount: '',
      })
      return
    }

    // If toggled ON and there is at least one indebted crew member, keep dropdown ready
    setExpenseForm({
      ...expenseForm,
      hasKasbonDeduction: true,
    })
  }

  // Handle selecting an indebted crew member -> auto-fill deduction with their debt amount
  const handleSelectIndebtedCrew = (crewIdStr) => {
    const chosen = indebtedCrewOptions.find(
      (c) => String(c.id) === String(crewIdStr),
    )
    if (!chosen) {
      setExpenseForm({
        ...expenseForm,
        crewMemberId: crewIdStr,
        kasbonDeductionAmount: '',
      })
      return
    }

    const grossAmount = Number(expenseForm.amount || 0)
    const defaultDeduction =
      grossAmount > 0
        ? Math.min(chosen.availableDebt, grossAmount)
        : chosen.availableDebt

    setExpenseForm({
      ...expenseForm,
      crewMemberId: crewIdStr,
      kasbonDeductionAmount: String(defaultDeduction),
    })
  }

  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmittingExpense(true)
      setError('')
      const payload = {
        transactionDate: expenseForm.transactionDate,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        hasKasbonDeduction: Boolean(expenseForm.hasKasbonDeduction),
        crewMemberId: expenseForm.hasKasbonDeduction
          ? Number(expenseForm.crewMemberId)
          : null,
        kasbonDeductionAmount: expenseForm.hasKasbonDeduction
          ? Number(expenseForm.kasbonDeductionAmount)
          : null,
      }
      if (editingExpense) {
        await tripApi.updateExpense(tripId, editingExpense.id, payload)
      } else {
        await tripApi.createExpense(tripId, payload)
      }
      closeExpenseModal()
      await loadTripDetails()
    } catch (err) {
      setError(err.message || 'Failed to save trip expense')
    } finally {
      setSubmittingExpense(false)
    }
  }

  const handleDeleteExpense = async (exp) => {
    const confirmMsg = exp.hasKasbonDeduction
      ? `Delete expense "${exp.description}" (${formatCurrency(exp.amount)})? This will also reverse the ${formatCurrency(exp.kasbonDeductionAmount)} kasbon repayment for ${exp.crewMember?.name}.`
      : `Delete expense "${exp.description}" (${formatCurrency(exp.amount)})?`
    if (!window.confirm(confirmMsg)) return

    try {
      setError('')
      await tripApi.deleteExpense(tripId, exp.id)
      await loadTripDetails()
    } catch (err) {
      setError(err.message || 'Failed to delete expense')
    }
  }

  if (loading && !trip) {
    return (
      <div className="bg-brand-surface rounded-2xl border border-brand-secondary p-12 text-center text-brand-navy/60 text-sm">
        Loading trip accounting details...
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="bg-brand-surface rounded-2xl border border-brand-secondary p-12 text-center space-y-4">
        <p className="text-brand-navy font-semibold">Trip not found.</p>
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trips
        </Link>
      </div>
    )
  }

  const netProfit = Number(trip.netProfit || 0)

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Trips
        </Link>
      </div>

      {/* Trip Header Card */}
      <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-brand-secondary text-brand-accent text-xs font-bold">
                Trip #{trip.id}
              </span>
              <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
                <Ship className="w-5 h-5 text-brand-accent" />
                {trip.vessel?.name}
              </h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-secondary text-brand-navy">
                {trip.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-brand-navy/70 font-medium">
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
              <p className="text-sm text-brand-navy/70 pt-1">{trip.notes}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={openCreateIncomeModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-secondary text-brand-navy font-semibold text-sm hover:bg-brand-accent hover:text-brand-surface transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Income (Fish Sale)
            </button>
            <button
              onClick={openCreateExpenseModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-brand-surface font-semibold text-sm hover:opacity-95 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Trip Expense
            </button>
          </div>
        </div>
      </div>

      {/* 3 Required Trip Summary Cards: Income, Expense, Net Profit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-brand-surface rounded-2xl border border-brand-secondary p-6 shadow-xs relative overflow-hidden">
          <div className="h-1.5 bg-emerald-500 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Total Trip Income (Sales)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(trip.totalIncome)}
          </p>
          <p className="text-xs text-brand-navy/60 mt-1">
            {incomes.length} sale record(s) on this trip
          </p>
        </div>

        <div className="bg-brand-surface rounded-2xl border border-brand-secondary p-6 shadow-xs relative overflow-hidden">
          <div className="h-1.5 bg-rose-500 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Total Trip Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">
            {formatCurrency(trip.totalExpense)}
          </p>
          <p className="text-xs text-brand-navy/60 mt-1">
            {expenses.length} expense record(s) (recorded at full original value)
          </p>
        </div>

        <div className="bg-brand-surface rounded-2xl border border-brand-secondary p-6 shadow-xs relative overflow-hidden">
          <div className="h-1.5 bg-brand-accent absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Net Profit (Income - Expense)
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-secondary text-brand-accent flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold mt-2 ${
              netProfit >= 0 ? 'text-brand-navy' : 'text-rose-700'
            }`}
          >
            {formatCurrency(trip.netProfit)}
          </p>
          <p className="text-xs text-brand-navy/60 mt-1">
            {netProfit >= 0 ? 'Net surplus for this trip' : 'Net deficit for this trip'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* View Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-secondary pb-3">
        {[
          { id: 'ALL', label: 'Both Incomes & Expenses' },
          { id: 'EXPENSES', label: `Expenses (${expenses.length})` },
          { id: 'INCOMES', label: `Incomes / Sales (${incomes.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-brand-accent text-brand-surface shadow-xs'
                : 'bg-brand-surface text-brand-navy/80 border border-brand-secondary hover:bg-brand-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trip Expenses Section */}
      {(activeTab === 'ALL' || activeTab === 'EXPENSES') && (
        <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-secondary flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-accent" />
                Trip Expenses & Crew Wage Deductions
              </h2>
              <p className="text-xs text-brand-navy/65">
                Expenses are recorded at their full original value. Crew wage kasbon deductions automatically log a debt repayment.
              </p>
            </div>
            <button
              onClick={openCreateExpenseModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-accent text-brand-surface text-xs font-bold hover:opacity-95 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="p-10 text-center text-sm text-brand-navy/60">
              No expenses recorded for this trip yet. Click <strong>Add Expense</strong> to log trip capital, crew wages, or other costs.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-secondary/60 border-b border-brand-secondary text-xs font-bold uppercase tracking-wider text-brand-navy/70">
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Category & Description</th>
                    <th className="py-3.5 px-6">Original Expense / Gross Wage</th>
                    <th className="py-3.5 px-6">Kasbon Deduction & Net Paid</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-secondary text-sm">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-brand-bg/80 transition-colors">
                      <td className="py-4 px-6 text-brand-navy/80 whitespace-nowrap">
                        {formatDate(exp.transactionDate)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-secondary text-brand-accent mb-1">
                          {CATEGORY_LABELS[exp.category] || exp.category}
                        </span>
                        <div className="font-semibold text-brand-navy">
                          {exp.description}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-rose-700 whitespace-nowrap">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-4 px-6">
                        {exp.hasKasbonDeduction ? (
                          <div className="bg-brand-secondary/60 border border-brand-accent/20 rounded-xl p-3 space-y-1 text-xs max-w-xs">
                            <div className="font-bold text-brand-navy flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-brand-accent" />
                              Crew: {exp.crewMember?.name || '-'}
                            </div>
                            <div className="flex justify-between text-brand-navy/80">
                              <span>1. Original Wage:</span>
                              <span className="font-semibold">
                                {formatCurrency(exp.amount)}
                              </span>
                            </div>
                            <div className="flex justify-between text-emerald-700">
                              <span>2. Kasbon Deduction (+In):</span>
                              <span className="font-bold">
                                - {formatCurrency(exp.kasbonDeductionAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between text-brand-navy font-bold pt-1 border-t border-brand-secondary">
                              <span>3. Net Wage Paid:</span>
                              <span>{formatCurrency(exp.netPaidAmount)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-navy/50">
                            No kasbon deduction (Paid in full:{' '}
                            {formatCurrency(exp.netPaidAmount ?? exp.amount)})
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditExpenseModal(exp)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-secondary text-brand-navy hover:bg-brand-accent hover:text-brand-surface text-xs font-semibold transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp)}
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
      )}

      {/* Trip Incomes (Fish Sales) Section */}
      {(activeTab === 'ALL' || activeTab === 'INCOMES') && (
        <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-secondary flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Trip Incomes (Fish Catch Sales)
              </h2>
              <p className="text-xs text-brand-navy/65">
                Record fish sales and catch revenue generated from this trip.
              </p>
            </div>
            <button
              onClick={openCreateIncomeModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-accent text-brand-surface text-xs font-bold hover:opacity-95 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Income (Sale)
            </button>
          </div>

          {incomes.length === 0 ? (
            <div className="p-10 text-center text-sm text-brand-navy/60">
              No fish sales recorded for this trip yet. Click <strong>Add Income (Sale)</strong> to log catch sales.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-secondary/60 border-b border-brand-secondary text-xs font-bold uppercase tracking-wider text-brand-navy/70">
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Sale Description / Fish Catch</th>
                    <th className="py-3.5 px-6">Sale Amount (Income)</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-secondary text-sm">
                  {incomes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-brand-bg/80 transition-colors">
                      <td className="py-4 px-6 text-brand-navy/80 whitespace-nowrap">
                        {formatDate(inc.transactionDate)}
                      </td>
                      <td className="py-4 px-6 font-semibold text-brand-navy">
                        {inc.description}
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-700 whitespace-nowrap">
                        + {formatCurrency(inc.amount)}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditIncomeModal(inc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-secondary text-brand-navy hover:bg-brand-accent hover:text-brand-surface text-xs font-semibold transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteIncome(inc)}
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
      )}

      {/* ==================== MODAL 1: ADD / EDIT TRIP INCOME ==================== */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4">
          <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-secondary">
              <h2 className="text-lg font-bold text-brand-navy">
                {editingIncome ? 'Edit Trip Income (Sale)' : 'Add Trip Income (Fish Sale)'}
              </h2>
              <button
                onClick={closeIncomeModal}
                className="p-1.5 rounded-lg text-brand-navy/60 hover:bg-brand-secondary hover:text-brand-navy transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIncomeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Sale Date *
                </label>
                <input
                  type="date"
                  required
                  value={incomeForm.transactionDate}
                  onChange={(e) =>
                    setIncomeForm({ ...incomeForm, transactionDate: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Fish Sale Description *
                </label>
                <input
                  type="text"
                  required
                  value={incomeForm.description}
                  onChange={(e) =>
                    setIncomeForm({ ...incomeForm, description: e.target.value })
                  }
                  placeholder="e.g. Tuna 500kg & Skipjack 800kg auction sale"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Total Sale Amount (Rp) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={incomeForm.amount}
                  onChange={(e) =>
                    setIncomeForm({ ...incomeForm, amount: e.target.value })
                  }
                  placeholder="e.g. 15000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-secondary">
                <button
                  type="button"
                  onClick={closeIncomeModal}
                  className="px-4 py-2 rounded-xl bg-brand-secondary text-brand-navy text-sm font-semibold hover:opacity-90 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIncome}
                  className="px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingIncome
                    ? 'Saving...'
                    : editingIncome
                      ? 'Save Changes'
                      : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ADD / EDIT TRIP EXPENSE + KASBON DEDUCTION ==================== */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xl max-w-lg w-full overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-secondary">
              <div>
                <h2 className="text-lg font-bold text-brand-navy">
                  {editingExpense ? 'Edit Trip Expense' : 'Record Trip Expense'}
                </h2>
                <p className="text-xs text-brand-navy/60">
                  Enter the expense details below. You can optionally deduct a crew member&apos;s kasbon debt.
                </p>
              </div>
              <button
                onClick={closeExpenseModal}
                className="p-1.5 rounded-lg text-brand-navy/60 hover:bg-brand-secondary hover:text-brand-navy transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              {/* Step 1: Normal Expense Value, Category, Date, Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.transactionDate}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        transactionDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                    Expense Category *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1">
                  Original Expense / Normal Gross Wage (Rp) *
                </label>
                <p className="text-[11px] text-brand-navy/60 mb-1.5">
                  Recorded in full as a trip expense (before any kasbon deduction).
                </p>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  placeholder="e.g. 2000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm font-semibold focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, description: e.target.value })
                  }
                  placeholder="e.g. Trip wage for Budi Santoso / Diesel & Ice supplies"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-bg text-brand-navy text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* Step 2: Toggle for Crew Kasbon Deduction */}
              <div className="pt-2 border-t border-brand-secondary">
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-brand-secondary/60 border border-brand-accent/20 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={expenseForm.hasKasbonDeduction}
                    onChange={(e) => handleToggleKasbonDeduction(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-brand-accent rounded cursor-pointer"
                  />
                  <div>
                    <span className="block text-sm font-bold text-brand-navy">
                      Deduct Crew Cash Advance (Kasbon) on this expense
                    </span>
                    <span className="block text-xs text-brand-navy/70 mt-0.5">
                      Automatically deducts a crew member&apos;s outstanding kasbon debt and logs a debt repayment (+In).
                    </span>
                  </div>
                </label>
              </div>

              {/* Step 3: Indebted Crew Dropdown, Auto-Filled Deduction Input, and Ordered Breakdown Box */}
              {expenseForm.hasKasbonDeduction && (
                <div className="space-y-4 p-4 rounded-2xl bg-brand-bg border border-brand-secondary">
                  {indebtedCrewOptions.length === 0 ? (
                    <div className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      No crew members currently have an active kasbon debt (&gt; Rp 0).
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                          Select Crew Member with Active Debt *
                        </label>
                        <select
                          required={expenseForm.hasKasbonDeduction}
                          value={expenseForm.crewMemberId}
                          onChange={(e) => handleSelectIndebtedCrew(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-surface text-brand-navy text-sm font-medium focus:outline-none focus:border-brand-accent"
                        >
                          <option value="" disabled>
                            Choose crew member with kasbon debt...
                          </option>
                          {indebtedCrewOptions.map((crew) => (
                            <option key={crew.id} value={crew.id}>
                              {crew.name} ({crew.role}) — Total Debt:{' '}
                              {formatCurrency(crew.availableDebt)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80">
                            Kasbon Deduction Amount (Rp) *
                          </label>
                          {selectedExpenseCrew && (
                            <span className="text-[11px] font-bold text-brand-accent">
                              Active Debt: {formatCurrency(selectedExpenseCrew.availableDebt)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-brand-navy/60 mb-1.5">
                          Auto-filled from crew member&apos;s kasbon debt; you can adjust this amount if doing a partial deduction.
                        </p>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          required={expenseForm.hasKasbonDeduction}
                          value={expenseForm.kasbonDeductionAmount}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              kasbonDeductionAmount: e.target.value,
                            })
                          }
                          placeholder="Auto-filled when crew is selected"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-secondary bg-brand-surface text-brand-navy text-sm font-semibold focus:outline-none focus:border-brand-accent"
                        />
                      </div>

                      {/* Intuitive Ordered Breakdown Box:
                          1. Normal / Original Wage
                          2. Kasbon Deduction
                          3. Net Wage After Deduction */}
                      <div className="rounded-xl bg-brand-surface border-2 border-brand-accent/30 p-4 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-accent">
                          <CheckCircle2 className="w-4 h-4" />
                          Wage & Kasbon Deduction Summary
                        </div>

                        <div className="space-y-2 text-xs pt-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-brand-navy block">
                                1. Original / Normal Wage
                              </span>
                              <span className="text-[11px] text-brand-navy/60">
                                Recorded in Trip Expenses
                              </span>
                            </div>
                            <span className="text-sm font-bold text-brand-navy">
                              {formatCurrency(expenseBreakdown.grossAmount)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-emerald-700 block">
                                2. Kasbon Deduction (Debt Repayment)
                              </span>
                              <span className="text-[11px] text-brand-navy/60">
                                Recorded as +In Repayment in Crew Kasbon Ledger
                              </span>
                            </div>
                            <span className="text-sm font-bold text-emerald-700">
                              - {formatCurrency(expenseBreakdown.deduction)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-brand-secondary">
                            <div>
                              <span className="font-bold text-brand-accent block text-sm">
                                3. Net Wage Paid After Deduction
                              </span>
                              <span className="text-[11px] text-brand-navy/65">
                                Actual cash received by{' '}
                                {selectedExpenseCrew?.name || 'Crew Member'}
                              </span>
                            </div>
                            <span className="text-base font-extrabold text-brand-navy bg-brand-secondary px-3 py-1 rounded-lg">
                              = {formatCurrency(expenseBreakdown.netReceived)}
                            </span>
                          </div>
                        </div>

                        {selectedExpenseCrew && (
                          <div className="pt-2 border-t border-brand-secondary flex items-center justify-between text-[11px] text-brand-navy/70">
                            <span>
                              Remaining Kasbon Debt for {selectedExpenseCrew.name} after save:
                            </span>
                            <strong className="text-brand-navy">
                              {formatCurrency(expenseBreakdown.remainingDebtAfter)}
                            </strong>
                          </div>
                        )}

                        {expenseBreakdown.isDeductionOverGross && (
                          <p className="text-xs font-semibold text-red-600 pt-1">
                            Warning: Deduction amount cannot exceed the original wage/expense amount.
                          </p>
                        )}
                        {expenseBreakdown.isDeductionOverDebt && (
                          <p className="text-xs font-semibold text-red-600 pt-1">
                            Warning: Deduction amount exceeds this crew member&apos;s active kasbon debt.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-secondary">
                <button
                  type="button"
                  onClick={closeExpenseModal}
                  className="px-4 py-2 rounded-xl bg-brand-secondary text-brand-navy text-sm font-semibold hover:opacity-90 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingExpense ||
                    expenseBreakdown.isDeductionOverGross ||
                    expenseBreakdown.isDeductionOverDebt ||
                    (expenseForm.hasKasbonDeduction && indebtedCrewOptions.length === 0)
                  }
                  className="px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingExpense
                    ? 'Saving...'
                    : editingExpense
                      ? 'Save Changes'
                      : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

