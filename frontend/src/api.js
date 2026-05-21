import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pk_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — clear token
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pk_token')
      localStorage.removeItem('pk_user')
    }
    return Promise.reject(err)
  }
)

export default api
