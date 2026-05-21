import { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('pk_user')
    const token  = localStorage.getItem('pk_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
      // Refresh profile from server
      api.get('/auth/perfil')
        .then(r => { setUser(r.data); localStorage.setItem('pk_user', JSON.stringify(r.data)) })
        .catch(() => { localStorage.removeItem('pk_token'); localStorage.removeItem('pk_user'); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    const r = await api.post('/auth/login', form)
    localStorage.setItem('pk_token', r.data.access_token)
    const profile = await api.get('/auth/perfil')
    localStorage.setItem('pk_user', JSON.stringify(profile.data))
    setUser(profile.data)
    return profile.data
  }

  const registro = async (data) => {
    const r = await api.post('/auth/registro', data)
    localStorage.setItem('pk_token', r.data.access_token)
    const profile = await api.get('/auth/perfil')
    localStorage.setItem('pk_user', JSON.stringify(profile.data))
    setUser(profile.data)
    return profile.data
  }

  const logout = () => {
    localStorage.removeItem('pk_token')
    localStorage.removeItem('pk_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
