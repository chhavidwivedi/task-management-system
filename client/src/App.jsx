
import { useEffect, useMemo, useState } from 'react'
import Login from './pages/Login'
import api from './services/api'

import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Settings,
  Search,
  Plus,
  CalendarDays,
  Clock3,
  CircleCheck,
  AlertCircle,
  Menu,
  X,
  ChevronDown,
  ListTodo,
  ArrowUpRight,
  LogOut,
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const initialTasks = [
  {
    id: 1,
    title: 'Build authentication APIs',
    project: 'Backend',
    priority: 'High',
    status: 'In Progress',
    due: '2026-10-25',
    assignee: 'CD',
  },
  {
    id: 2,
    title: 'Design dashboard UI',
    project: 'Frontend',
    priority: 'High',
    status: 'In Progress',
    due: '2026-10-26',
    assignee: 'AK',
  },
  {
    id: 3,
    title: 'Create database schema',
    project: 'Backend',
    priority: 'Medium',
    status: 'Completed',
    due: '2026-10-21',
    assignee: 'CD',
  },
  {
    id: 4,
    title: 'Write API documentation',
    project: 'Documentation',
    priority: 'Low',
    status: 'To Do',
    due: '2026-10-28',
    assignee: 'RS',
  },
  {
    id: 5,
    title: 'Test registration flow',
    project: 'Testing',
    priority: 'Medium',
    status: 'To Do',
    due: '2026-10-22',
    assignee: 'AK',
  },
]




const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'My Tasks', icon: CheckSquare },
  { label: 'Kanban Board', icon: ListTodo },
  { label: 'Team', icon: Users },
  { label: 'Settings', icon: Settings },
]


function App() {
  // Authentication state
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Dashboard state
  const [tasks, setTasks] = useState(initialTasks)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [activeNav, setActiveNav] = useState('Overview')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [newAssignee, setNewAssignee] = useState('')
  const [newPriority, setNewPriority] = useState('Medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [newStatus, setNewStatus] = useState('To Do')

  const [error, setError] = useState('')
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [stats, setStats] = useState(null)

  // Restore an existing login session
  useEffect(() => {
    async function checkSession() {
      const token = localStorage.getItem('token')

      if (!token) {
        setAuthChecked(true)
        return
      }

      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
      } catch {
        localStorage.removeItem('token')
      } finally {
        setAuthChecked(true)
      }
    }

    checkSession()
  }, [])

  // Fetch tasks after successful login
  useEffect(() => {
    if (!user) return

    async function fetchTasks() {
      setLoadingTasks(true)
      setError('')

      try {
        const { data } = await api.get('/tasks')

        const backendTasks = (data.tasks || []).map(task => ({
          ...task,
          due: task.due_date
            ? String(task.due_date).slice(0, 10)
            : 'No due date',
          project: task.description || 'General',
          assignee: task.assignee_name
            ? task.assignee_name
                .split(' ')
                .map(part => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            : '—',
        }))

        setTasks(backendTasks)
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Could not load tasks. Check that your backend is running.'
        )
      } finally {
        setLoadingTasks(false)
      }
    }

    fetchTasks()
  }, [user])

  useEffect(() => {
  if (!user) return

  async function fetchStats() {
    try {
      const { data } = await api.get('/tasks/stats')
      setStats(data.stats)
    } catch (err) {
      console.error('Could not load dashboard statistics:', err)
    }
  }

  fetchStats()
}, [user, tasks])

useEffect(() => {
  if (!user) return

  async function fetchTeamMembers() {
    try {
      const { data } = await api.get('/tasks/users')
      setTeamMembers(data.users)
    } catch (err) {
      console.error('Could not load team members:', err)
    }
  }

  fetchTeamMembers()
}, [user])

  const today = new Date().toISOString().slice(0, 10)

  const completed = tasks.filter(
    task => task.status === 'Completed'
  ).length

  const pending = tasks.filter(
    task => task.status !== 'Completed'
  ).length

  const overdue = tasks.filter(
    task =>
      task.status !== 'Completed' &&
      task.due !== 'No due date' &&
      task.due < today
  ).length
  const chartData = [
  {
    day: 'To Do',
    created: tasks.filter(t => t.status === 'To Do').length,
    completed: 0,
  },
  {
    day: 'In Progress',
    created: tasks.filter(t => t.status === 'In Progress').length,
    completed: 0,
  },
  {
    day: 'Completed',
    created: tasks.filter(t => t.status === 'Completed').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
  },
]

  const filteredTasks = useMemo(
    () =>
      tasks
        .filter(task =>
          task.title.toLowerCase().includes(search.toLowerCase())
        )
        .filter(
          task =>
            statusFilter === 'All' || task.status === statusFilter
        )
        .filter(
          task =>
            priorityFilter === 'All' ||
            task.priority === priorityFilter
        )
        .sort((a, b) => {
          if (a.due === 'No due date') return 1
          if (b.due === 'No due date') return -1
          return a.due.localeCompare(b.due)
        }),
    [tasks, search, statusFilter, priorityFilter]
  )

  async function updateStatus(id, status) {
    const previousTasks = tasks

    // Update the screen immediately
    setTasks(current =>
      current.map(task =>
        task.id === id ? { ...task, status } : task
      )
    )

    try {
      await api.put(`/tasks/${id}`, { status })
      setError('')
    } catch (err) {
      setTasks(previousTasks)
      setError(
        err.response?.data?.message ||
          'Could not update task status.'
      )
    }
  }
  
async function deleteTask(id) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this task?'
  )

  if (!confirmed) return

  const previousTasks = tasks
  setTasks(current => current.filter(task => task.id !== id))
  setError('')

  try {
    await api.delete(`/tasks/${id}`)
  } catch (err) {
    setTasks(previousTasks)
    setError(
      err.response?.data?.message || 'Could not delete task.'
    )
  }
}


  async function addTask(e) {
    e.preventDefault()

if (!newTitle.trim()) {
  setError('Task title is required.')
  return
}

if (newTitle.trim().length < 3) {
  setError('Task title must be at least 3 characters.')
  return
}

if (newTitle.trim().length > 200) {
  setError('Task title must be 200 characters or fewer.')
  return
}

    setError('')

    try {
      const { data } = await api.post('/tasks', {
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        status: newStatus,
        due_date: newDueDate || null,
        assigned_to: newAssignee ? Number(newAssignee) : null,
      })

      const task = data.task

      setTasks(current => [
        {
          ...task,
          due: task.due_date
            ? String(task.due_date).slice(0, 10)
            : 'No due date',
          project: task.description || 'General',
          assignee: user?.name
            ? user.name
                .split(' ')
                .map(part => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            : '—',
        },
        ...current,
      ])

      setNewTitle('')
      setNewDescription('')
      setNewPriority('Medium')
      setNewStatus('To Do')
      setNewDueDate('')
      setNewAssignee('')
      setShowForm(false)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not create task. Please try again.'
      )
    }
  }

  
async function saveEditedTask(e) {
  e.preventDefault()

  if (!editingTask || !editingTask.title.trim()) return

  setError('')

  try {
    const { data } = await api.put(`/tasks/${editingTask.id}`, {
      title: editingTask.title.trim(),
      description: editingTask.description,
      priority: editingTask.priority,
      status: editingTask.status,
      due_date: editingTask.due_date || null,
    })

    setTasks(current =>
      current.map(task =>
        task.id === editingTask.id
          ? {
              ...task,
              ...data.task,
              due: data.task.due_date
                ? String(data.task.due_date).slice(0, 10)
                : 'No due date',
            }
          : task
      )
    )

    setEditingTask(null)
  } catch (err) {
    setError(err.response?.data?.message || 'Could not update task.')
  }
}


  
async function saveEditedTask(e) {
  e.preventDefault()
  if (!editingTask || !editingTask.title.trim()) return

  setError('')

  try {
    const { data } = await api.put(`/tasks/${editingTask.id}`, {
      title: editingTask.title.trim(),
      description: editingTask.description,
      priority: editingTask.priority,
      status: editingTask.status,
      due_date: editingTask.due_date || null,
    })

    setTasks(current =>
      current.map(task =>
        task.id === editingTask.id
          ? {
              ...task,
              ...data.task,
              due: data.task.due_date
                ? String(data.task.due_date).slice(0, 10)
                : 'No due date',
            }
          : task
      )
    )

    setEditingTask(null)
  } catch (err) {
    setError(err.response?.data?.message || 'Could not update task.')
  }
}

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
    setTasks([])
    setError('')
    setAuthChecked(true)
  }

  // Keep all hooks above these conditional returns
  if (!authChecked) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b1020] text-white">
        Checking your session...
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      {mobileMenu && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#0f172a] p-5 transition-transform lg:translate-x-0 ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500">
              <CheckSquare size={22} />
            </div>

            <div>
              <h1 className="font-bold tracking-wide">TaskFlow</h1>
              <p className="text-xs text-slate-400">Workspace</p>
            </div>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setMobileMenu(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="space-y-2">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label)
                setMobileMenu(false)
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                activeNav === label
                  ? 'bg-indigo-500/15 text-indigo-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-indigo-300">
            <ListTodo size={18} />
            <span className="text-sm font-semibold">Stay organized</span>
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Keep your tasks moving and your team aligned.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-500/20 font-semibold text-violet-300">
            {(user.name || user.email || 'U')
              .split(' ')
              .map(part => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.name || user.email}
            </p>
            
            <p className="text-xs capitalize text-slate-500">
              {user.role === 'admin' ? 'Admin' : 'User'}
            </p>

          </div>

          <button
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            className="text-slate-500 transition hover:text-rose-300"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#0b1020]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setMobileMenu(true)}
              aria-label="Open menu"
            >
              <Menu />
            </button>

            <div>
              <p className="text-sm text-slate-400">
                Workspace / {activeNav}
              </p>
              <p className="font-semibold">
                {activeNav === 'Overview' ? 'Overview' : activeNav}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:block">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>

            <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold">
              {(user.name || user.email || 'U')
                .split(' ')
                .map(part => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-7 p-5 sm:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm text-indigo-300">
                YOUR WORKSPACE
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Good afternoon! <span>👋</span>
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Here's what's happening with your tasks today.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
            >
              <Plus size={18} />
              Create task
            </button>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200"
            >
              {error}
            </div>
          )}
          {showForm && (
            <form
            onSubmit={addTask}
            className="flex flex-col gap-3 rounded-2xl border border-indigo-400/20 bg-[#111a2e] p-5"
            >
              <input
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Enter task title..."
                className="rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none focus:border-indigo-400"
              />

               <textarea
                  placeholder="Task description (optional)"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none focus:border-indigo-400"
               />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm"
                  >
                    <option value="Low">Low priority</option>
                    <option value="Medium">Medium priority</option>
                    <option value="High">High priority</option>
                  </select>

                  <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                      className="rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm"
                    >
                     <option value="To Do">To Do</option>
                     <option value="In Progress">In Progress</option>
                     <option value="Completed">Completed</option>
                  </select>

                  <input
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label>Assign To</label>
                    <select
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                    >
                      <option value="">Select a team member</option>
                        {teamMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.role})
                          </option>
                          ))}
                     </select>
                 </div>

                  <div className="flex gap-3">
                    <button
                    type="submit"
                    className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400"
                    >
                     Add task
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300"
                    >
                     Cancel
                    </button>
                  </div>
             </form>
          )}

          
{editingTask && (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
    <form
      onSubmit={saveEditedTask}
      className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#111a2e] p-6"
    >
      <h2 className="text-lg font-semibold">Edit Task</h2>

      <input
        required
        value={editingTask.title}
        onChange={e =>
          setEditingTask({ ...editingTask, title: e.target.value })
        }
        placeholder="Task title"
        className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm"
      />

      <textarea
        value={editingTask.description}
        onChange={e =>
          setEditingTask({ ...editingTask, description: e.target.value })
        }
        placeholder="Description"
        className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm"
      />

      <label className="block text-sm text-slate-300">Priority</label>
      <select
        value={editingTask.priority}
        onChange={e =>
          setEditingTask({ ...editingTask, priority: e.target.value })
        }
        className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm"
      >
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>

      <label className="block text-sm text-slate-300">Status</label>
      <select
        value={editingTask.status}
        onChange={e =>
          setEditingTask({ ...editingTask, status: e.target.value })
        }
        className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm"
      >
        <option>To Do</option>
        <option>In Progress</option>
        <option>Completed</option>
      </select>

      <label className="block text-sm text-slate-300">Due date</label>
      <input
        type="date"
        value={editingTask.due_date}
        onChange={e =>
          setEditingTask({ ...editingTask, due_date: e.target.value })
        }
        className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm"
      />

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => setEditingTask(null)}
          className="rounded-xl border border-white/10 px-5 py-3 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
)}




          


          {activeNav === 'Overview' && (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total tasks',
                value: stats?.total ?? tasks.length,
                icon: ListTodo,
                color: 'text-indigo-300',
                bg: 'bg-indigo-400/10',
                note: 'Across your workspace',
              },
              {
                label: 'Pending tasks',
                value: stats?.pending ?? pending,
                icon: Clock3,
                color: 'text-amber-300',
                bg: 'bg-amber-400/10',
                note: 'Still need attention',
              },
              {
                label: 'Completed',
                value: stats?.completed ?? completed,
                icon: CircleCheck,
                color: 'text-emerald-300',
                bg: 'bg-emerald-400/10',
                note: 'Successfully finished',
              },
              {
                label: 'Overdue',
                value: stats?.overdue ?? overdue,
                icon: AlertCircle,
                color: 'text-rose-300',
                bg: 'bg-rose-400/10',
                note: 'Past their due date',
              },

          





            ].map(({ label, value, icon: Icon, color, bg, note }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.08] bg-[#111a2e] p-5 transition hover:border-white/15"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{label}</span>
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-xl ${bg} ${color}`}
                  >
                    <Icon size={20} />
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <span className="text-3xl font-bold">{value}</span>
                  <ArrowUpRight size={18} className="mb-1 text-slate-500" />
                </div>

                <p className="mt-2 text-xs text-slate-500">{note}</p>
              </div>
            ))}
          </section>
          )}
          

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/[0.08] bg-[#111a2e] p-5 xl:col-span-3 sm:p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">Task activity</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Sample weekly task activity
                  </p>
                </div>

                <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">
                  This week <ChevronDown size={14} className="ml-1 inline" />
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={5}>
                    <CartesianGrid
                      stroke="#273449"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111a2e',
                        border: '1px solid #334155',
                        borderRadius: 12,
                      }}
                    />
                    <Bar
                      dataKey="created"
                      name="Created"
                      fill="#6366f1"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill="#34d399"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex gap-5 text-xs text-slate-400">
                <span>
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-400" />
                  Created
                </span>
                <span>
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  Completed
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#111a2e] p-5 xl:col-span-2 sm:p-6">
              <h3 className="font-semibold">Task status</h3>
              <p className="mt-1 text-sm text-slate-400">
                Current distribution
              </p>

              <div className="mt-7 space-y-6">
                {[
                  {
                    label: 'To Do',
                    color: 'bg-slate-400',
                    count: tasks.filter(t => t.status === 'To Do').length,
                  },
                  {
                    label: 'In Progress',
                    color: 'bg-indigo-400',
                    count: tasks.filter(t => t.status === 'In Progress').length,
                  },
                  {
                    label: 'Completed',
                    color: 'bg-emerald-400',
                    count: completed,
                  },
                ].map(item => (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="text-slate-400">
                        {item.count} tasks
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{
                          width: `${
                            tasks.length
                              ? (item.count / tasks.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-indigo-400/15 bg-indigo-400/[0.06] p-4">
                <p className="text-sm font-medium text-indigo-200">
                  Keep it moving
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Small, consistent progress adds up. Pick your next priority
                  task and get started.
                </p>
              </div>
            </div>
          </section>
        {activeNav === 'My Tasks' && (
          <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111a2e]">
            <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h3 className="font-semibold">Your tasks</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Manage and track your team's work
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 sm:w-52">
                  <Search size={17} className="shrink-0 text-slate-500" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0b1020] px-3 py-2.5 text-sm outline-none"
                >
                  <option>All</option>
                  <option>To Do</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0b1020] px-3 py-2.5 text-sm outline-none"
                >
                  <option>All</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Task name</th>
                    <th className="px-6 py-4 font-medium">Priority</th>
                    <th className="px-6 py-4 font-medium">Due date</th>
                    <th className="px-6 py-4 font-medium">Assignee</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {filteredTasks.map(task => (
                    <tr
                      key={task.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-200">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {task.project || 'General'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                            task.priority === 'High'
                              ? 'bg-rose-400/10 text-rose-300'
                              : task.priority === 'Medium'
                                ? 'bg-amber-400/10 text-amber-300'
                                : 'bg-slate-400/10 text-slate-300'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        <CalendarDays size={14} className="mr-2 inline" />
                        {task.due}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-violet-400/10 text-xs font-semibold text-violet-300">
                          {task.assignee || '—'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          aria-label={`Status for ${task.title}`}
                          value={task.status}
                          onChange={e =>
                            updateStatus(task.id, e.target.value)
                          }
                          className="max-w-36 rounded-lg border border-white/10 bg-[#0b1020] px-2 py-2 text-xs outline-none"
                        >
                          <option>To Do</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                        </select>
                      </td>
                      
                      <td className="px-6 py-4">
                      <div className="flex gap-2">
                        
                      <button
                        type="button"
                        onClick={() =>
                        setEditingTask({
                          id: task.id,
                          title: task.title || '',
                          description: task.description || '',
                          priority: task.priority || 'Medium',
                          status: task.status || 'To Do',
                          due_date: task.due_date
                       ? String(task.due_date).slice(0, 10)
                       : '',
                     })
                   }
                    className="rounded-lg border border-indigo-400/20 px-3 py-2 text-xs text-indigo-300 hover:bg-indigo-400/10"
                    >
                    Edit
                  </button>

                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="rounded-lg border border-rose-400/20 px-3 py-2 text-xs text-rose-300 hover:bg-rose-400/10"
                        >
                          Delete
                        </button>
                      </div>
                      </td>

                    </tr>
                  ))}

                  {!loadingTasks && filteredTasks.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        No tasks found. Create a task or change your filters.
                      </td>
                    </tr>
                  )}

                  {loadingTasks && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        Loading tasks...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/[0.08] px-6 py-4 text-xs text-slate-500">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </section>
        )}

        
        {activeNav === 'Kanban Board' && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {['To Do', 'In Progress', 'Completed'].map(status => (
          <div
            key={status}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{status}</h2>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs">
                {filteredTasks.filter(task => task.status === status).length}
              </span>
              </div>

            <div className="space-y-3">
              {filteredTasks
                .filter(task => task.status === status)
                .map(task => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-white/10 bg-[#0b1020] p-4"
                  >
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {task.description || task.project || 'No description'}
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                      Priority: {task.priority}
                    </p>
                    <select
                      value={task.status}
                      onChange={e => updateStatus(task.id, e.target.value)}
                      className="mt-3 w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm"
                    >
                      <option>To Do</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                 </div>
            ))}

          {filteredTasks.filter(task => task.status === status).length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              No tasks in this column
            </p>
          )}
        </div>
      </div>
    ))}
  </section>
)}


{activeNav === 'Team' && (
  <section className="rounded-2xl border border-white/10 bg-[#111a2e] p-5">
    <h2 className="mb-4 text-lg font-semibold">Team Members</h2>

    {teamMembers.length === 0 ? (
      <p className="text-sm text-slate-400">No team members found.</p>
    ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map(member => (
          <div
            key={member.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <h3 className="font-medium">{member.name}</h3>
            <p className="mt-1 text-sm capitalize text-slate-400">
              {member.role}
            </p>
          </div>
        ))}
      </div>
    )}
  </section>
)}


          <footer className="pb-4 text-center text-xs text-slate-600">
            TaskFlow · Task Management System
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
