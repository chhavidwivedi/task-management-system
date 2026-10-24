
import { useState } from 'react'
import api from '../services/api'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isRegister
        ? '/auth/register'
        : '/auth/login'

      const body = isRegister
        ? { name, email, password }
        : { email, password }

      const { data } = await api.post(endpoint, body)

      localStorage.setItem('token', data.token)
      onLogin(data.user)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to connect to the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1020] p-5 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#111a2e] p-8"
      >
        <div>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-indigo-500 text-xl font-bold">
            T
          </div>
          <h1 className="text-2xl font-bold">TaskFlow</h1>
          <p className="mt-2 text-sm text-slate-400">
            {isRegister
              ? 'Create your workspace account'
              : 'Sign in to manage your tasks'}
          </p>
        </div>

        {isRegister && (
          <input
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-white/10 bg-[#0b1020] p-3 outline-none focus:border-indigo-400"
          />
        )}

        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full rounded-xl border border-white/10 bg-[#0b1020] p-3 outline-none focus:border-indigo-400"
        />

        <input
          required
          minLength={isRegister ? 8 : undefined}
          maxLength={72}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-white/10 bg-[#0b1020] p-3 outline-none focus:border-indigo-400"
        />

        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-indigo-500 p-3 font-semibold hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading
            ? 'Please wait...'
            : isRegister
              ? 'Create account'
              : 'Sign in'}
        </button>

        <p className="text-center text-sm text-slate-400">
          {isRegister
            ? 'Already have an account?'
            : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
            }}
            className="text-indigo-300 hover:text-indigo-200"
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </form>
    </div>
  )
}
