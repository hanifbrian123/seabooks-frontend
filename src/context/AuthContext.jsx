import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  const saveSession = (authResponse) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, authResponse.token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authResponse.user))
    setUser(authResponse.user)
  }

  const clearSession = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setUser(null)
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    authApi
      .me()
      .then((profile) => {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
        setUser(profile)
      })
      .catch(() => {
        clearSession()
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => clearSession()
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const register = async (payload) => {
    const res = await authApi.register(payload)
    saveSession(res)
    return res
  }

  const login = async (payload) => {
    const res = await authApi.login(payload)
    saveSession(res)
    return res
  }

  const loginWithGoogle = async (payload) => {
    const res = await authApi.googleAuth(payload)
    saveSession(res)
    return res
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        loginWithGoogle,
        logout: clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
