'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase' // adjust based on your setup

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const q = query(collection(db, 'users'), where('email', '==', email))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setError('No user found with this email')
        return
      }

      const userData = snapshot.docs[0].data()
      if (userData.role !== 'admin') {
        setError('Access denied. Not an admin.')
        return
      }

      // Save admin status
      localStorage.setItem('isAdmin', 'true')
      router.push('/dashboard')
    } catch (err) {
      setError('Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 text-white p-8 rounded-lg shadow-lg max-w-sm w-full"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>

        {error && (
          <p className="mb-4 text-red-500 text-sm text-center">{error}</p>
        )}

        <div className="mb-6">
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
        >
          Login
        </button>
      </form>
    </div>
  )
}
