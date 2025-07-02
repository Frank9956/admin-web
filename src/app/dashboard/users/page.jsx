'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/firebase'
import { useRouter } from 'next/navigation'
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  deleteDoc,
} from 'firebase/firestore'

export default function AdminUsers() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDetailsIds, setShowDetailsIds] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin',
  })
  const [editingUserId, setEditingUserId] = useState(null)
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin',
  })

  const roles = ['admin', 'delivery partner', 'store partner']

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setUsers(list)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const countByRole = (role) => users.filter((u) => u.role === role).length

  const updateUserRole = async (userId, newRole, updatedBy = 'admin') => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        role: newRole,
        roleHistory: arrayUnion({
          role: newRole,
          updatedAt: new Date(),
          updatedBy,
        }),
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: newRole,
                roleHistory: [
                  ...(u.roleHistory || []),
                  { role: newRole, updatedAt: new Date(), updatedBy },
                ],
              }
            : u
        )
      )
    } catch (err) {
      console.error('Failed to update user role:', err)
      alert('Failed to update user role')
    }
  }

  const handleAddUserChange = (e) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditUserChange = (e) => {
    const { name, value } = e.target
    setEditUserData((prev) => ({ ...prev, [name]: value }))
  }

  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      alert('Please fill name, email, and role')
      return
    }
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        ...newUser,
        createdAt: new Date(),
        roleHistory: [
          {
            role: newUser.role,
            updatedAt: new Date(),
            updatedBy: 'admin',
          },
        ],
      })
      setUsers((prev) => [{ id: docRef.id, ...newUser }, ...prev])
      setNewUser({ name: '', email: '', phone: '', role: 'admin' })
      setShowAddModal(false)
    } catch (err) {
      console.error('Error adding user:', err)
      alert('Failed to add user')
    }
  }

  const startEditUser = (user) => {
    setEditingUserId(user.id)
    setEditUserData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'admin',
    })
  }

  const cancelEdit = () => {
    setEditingUserId(null)
    setEditUserData({ name: '', email: '', phone: '', role: 'admin' })
  }

  const saveEditUser = async () => {
    if (!editUserData.name || !editUserData.email || !editUserData.role) {
      alert('Please fill name, email, and role')
      return
    }
    try {
      const userRef = doc(db, 'users', editingUserId)
      await updateDoc(userRef, {
        ...editUserData,
        roleHistory: arrayUnion({
          role: editUserData.role,
          updatedAt: new Date(),
          updatedBy: 'admin',
        }),
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                ...editUserData,
                roleHistory: [
                  ...(u.roleHistory || []),
                  { role: editUserData.role, updatedAt: new Date(), updatedBy: 'admin' },
                ],
              }
            : u
        )
      )
      cancelEdit()
    } catch (err) {
      console.error('Error saving user:', err)
      alert('Failed to save user')
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await deleteDoc(doc(db, 'users', userId))
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user')
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.removeItem('isAdmin')
      router.replace('/admin-login')
    }, 600000) // 10 minutes in milliseconds

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100 ">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-12">
        <div className="bg-blue-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Total Users</h2>
          <p className="text-4xl font-bold">{users.length}</p>
        </div>
        {roles.map((role) => (
          <div
            key={role}
            className={`rounded-lg p-6 shadow ${
              role === 'admin'
                ? 'bg-red-700'
                : role === 'delivery partner'
                ? 'bg-green-700'
                : 'bg-indigo-700'
            }`}
          >
            <h2 className="text-xl font-semibold mb-2 capitalize">{role} Users</h2>
            <p className="text-4xl font-bold">{countByRole(role)}</p>
          </div>
        ))}
      </div>

      {/* Add New User Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-black text-white px-5 py-3 rounded hover:bg-gray-800 transition"
        >
          + Add New User
        </button>
      </div>

      {/* Users List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">User List</h2>
        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="space-y-6">
            {users.slice(0, 10).map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-6 shadow bg-gray-800 text-gray-100 relative"
              >
                {/* Edit & Delete Buttons top right */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  {editingUserId === user.id ? (
                    <>
                      <button
                        onClick={saveEditUser}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-semibold transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm font-semibold transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditUser(user)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold transition"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {/* EDIT FORM UI ENHANCED */}
                {editingUserId === user.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      saveEditUser()
                    }}
                    className="space-y-4"
                  >
                    <label className="block">
                      <span className="text-sm font-medium mb-1 block text-gray-300">Name</span>
                      <input
                        type="text"
                        name="name"
                        value={editUserData.name}
                        onChange={handleEditUserChange}
                        className="w-full rounded-md border border-gray-600 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium mb-1 block text-gray-300">Email</span>
                      <input
                        type="email"
                        name="email"
                        value={editUserData.email}
                        onChange={handleEditUserChange}
                        className="w-full rounded-md border border-gray-600 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium mb-1 block text-gray-300">Phone</span>
                      <input
                        type="tel"
                        name="phone"
                        value={editUserData.phone}
                        onChange={handleEditUserChange}
                        className="w-full rounded-md border border-gray-600 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium mb-1 block text-gray-300">Role</span>
                      <select
                        name="role"
                        value={editUserData.role}
                        onChange={handleEditUserChange}
                        className="w-full rounded-md border border-gray-600 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </form>
                ) : (
                  <>
                    <p>
                      <strong>Name:</strong> {user.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {user.phone || '-'}
                    </p>
                    <p>
                      <strong>Role:</strong>{' '}
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateUserRole(user.id, e.target.value, 'admin')
                        }
                        className="bg-gray-700 rounded px-2 py-1 text-white cursor-pointer"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    </p>
                  </>
                )}

                {/* Toggle details */}
                <button
                  onClick={() =>
                    setShowDetailsIds((prev) => ({
                      ...prev,
                      [user.id]: !prev[user.id],
                    }))
                  }
                  className="mt-4 text-blue-400 hover:underline focus:outline-none"
                >
                  {showDetailsIds[user.id] ? 'Hide' : 'Show'} Login History
                </button>

                {/* Show login history */}
                {showDetailsIds[user.id] && (
                  <div
                    className="mt-4 bg-gray-700 rounded p-4 max-h-60 overflow-auto text-sm font-mono"
                    aria-live="polite"
                  >
                    {user.loginHistory && user.loginHistory.length > 0 ? (
                      <ul className="space-y-1">
                        {user.loginHistory
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(b.timestamp) - new Date(a.timestamp)
                          )
                          .map((login, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>
                                {new Date(login.timestamp).toLocaleString()}
                              </span>
                              <span className="text-gray-300">
                                {login.ip || 'IP Unknown'}
                              </span>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="italic">No login history available.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add New User Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg text-gray-100 relative">
            <h2 className="text-2xl font-bold mb-6">Add New User</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                addUser()
              }}
              className="space-y-5"
            >
              <label className="block">
                <span className="text-sm font-semibold mb-1 block">Name</span>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleAddUserChange}
                  className="w-full rounded-md border border-gray-600 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold mb-1 block">Email</span>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleAddUserChange}
                  className="w-full rounded-md border border-gray-600 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold mb-1 block">Phone</span>
                <input
                  type="tel"
                  name="phone"
                  value={newUser.phone}
                  onChange={handleAddUserChange}
                  className="w-full rounded-md border border-gray-600 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold mb-1 block">Role</span>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleAddUserChange}
                  className="w-full rounded-md border border-gray-600 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
