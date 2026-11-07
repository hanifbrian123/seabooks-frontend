const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '')
const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`
export const TOKEN_STORAGE_KEY = 'fishcatch_token'
export const USER_STORAGE_KEY = 'fishcatch_user'

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  if (!response.ok) {
    const errorMsg =
      data?.errors
        ? Object.values(data.errors).join(', ')
        : data?.message || `Request failed with status ${response.status}`
    throw new Error(errorMsg)
  }

  return data
}

export const authApi = {
  register: (payload) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  googleAuth: (payload) =>
    apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  startDemo: () =>
    apiRequest('/auth/demo', {
      method: 'POST',
    }),
  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),
  me: () => apiRequest('/auth/me'),
}

export const vesselApi = {
  getAll: () => apiRequest('/vessels'),
  getById: (id) => apiRequest(`/vessels/${id}`),
  create: (payload) =>
    apiRequest('/vessels', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/vessels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id) =>
    apiRequest(`/vessels/${id}`, {
      method: 'DELETE',
    }),
}

export const crewApi = {
  getAll: () => apiRequest('/crew'),
  getWithDebt: () => apiRequest('/crew/with-debt'),
  getById: (id) => apiRequest(`/crew/${id}`),
  create: (payload) =>
    apiRequest('/crew', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/crew/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id) =>
    apiRequest(`/crew/${id}`, {
      method: 'DELETE',
    }),
}

export const kasbonApi = {
  getAll: (crewMemberId) => {
    const query = crewMemberId ? `?crewMemberId=${crewMemberId}` : ''
    return apiRequest(`/kasbon${query}`)
  },
  getById: (id) => apiRequest(`/kasbon/${id}`),
  create: (payload) =>
    apiRequest('/kasbon', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/kasbon/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id) =>
    apiRequest(`/kasbon/${id}`, {
      method: 'DELETE',
    }),
}

export const tripApi = {
  getAll: () => apiRequest('/trips'),
  getById: (id) => apiRequest(`/trips/${id}`),
  create: (payload) =>
    apiRequest('/trips', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id) =>
    apiRequest(`/trips/${id}`, {
      method: 'DELETE',
    }),
  getIncomes: (tripId) => apiRequest(`/trips/${tripId}/incomes`),
  createIncome: (tripId, payload) =>
    apiRequest(`/trips/${tripId}/incomes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateIncome: (tripId, incomeId, payload) =>
    apiRequest(`/trips/${tripId}/incomes/${incomeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteIncome: (tripId, incomeId) =>
    apiRequest(`/trips/${tripId}/incomes/${incomeId}`, {
      method: 'DELETE',
    }),
  getExpenses: (tripId) => apiRequest(`/trips/${tripId}/expenses`),
  createExpense: (tripId, payload) =>
    apiRequest(`/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateExpense: (tripId, expenseId, payload) =>
    apiRequest(`/trips/${tripId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteExpense: (tripId, expenseId) =>
    apiRequest(`/trips/${tripId}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),
}
