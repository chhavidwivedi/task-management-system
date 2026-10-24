
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://task-management-system-dwq8.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the login token to authenticated requests.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
