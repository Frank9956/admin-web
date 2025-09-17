'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/firebase'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from 'firebase/firestore'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [form, setForm] = useState({
    coupon: '',
    title: '',
    description: '',
    image: '',
    wish: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const announcementsRef = collection(db, 'announcements')

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    const snap = await getDocs(announcementsRef)
    setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingId) {
        await updateDoc(doc(db, 'announcements', editingId), form)
        setEditingId(null)
      } else {
        await addDoc(announcementsRef, form)
      }
      setForm({ coupon: '', title: '', description: '', image: '', wish: '' })
      fetchAnnouncements()
    } catch (err) {
      console.error(err)
      alert('Error saving announcement')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (announcement) => {
    setForm({ ...announcement })
    setEditingId(announcement.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    await deleteDoc(doc(db, 'announcements', id))
    fetchAnnouncements()
  }

  return (
    <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-3xl font-bold mb-8">Manage Announcements</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-6 rounded-lg shadow">
            <input
              name="coupon"
              placeholder="Coupon Code"
              value={form.coupon}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="image"
              placeholder="Image URL"
              value={form.image}
              required
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="wish"
              placeholder="Wish"
              value={form.wish}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 transition px-6 py-2 rounded font-semibold disabled:opacity-50"
            >
              {editingId ? 'Update Announcement' : 'Add Announcement'}
            </button>
          </form>
        </div>

        {/* Right: List */}
        <div className="space-y-4 overflow-y-auto max-h-[70vh]">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-gray-800 p-4 rounded flex justify-between items-start gap-4"
            >
              <div>
                <p className="font-semibold text-lg">{a.title} ({a.coupon})</p>
                <p className="text-sm text-gray-400">{a.description}</p>
                {a.image && (
                  <img src={a.image} alt={a.title} className="mt-2 max-h-40 rounded" />
                )}
                {a.wish && <p className="text-xs mt-1 text-green-400">{a.wish}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleEdit(a)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
