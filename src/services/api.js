const API_BASE = '/api'

export async function apiRequest(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMsg =
      data?.errors
        ? Object.values(data.errors).join(', ')
        : data?.message || `Request failed with status ${response.status}`
    throw new Error(errorMsg)
  }

  return data
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

