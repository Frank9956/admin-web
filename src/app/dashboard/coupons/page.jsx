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
  Timestamp,
} from 'firebase/firestore'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({
    code: '',
    discount: '',
    maxDiscount: '',
    expiry: '',
    minPurchase: '',
    allowedList: '',
    notAllowedList: '',
    status: 'active',
    type: 'general',
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const couponsRef = collection(db, 'coupons')

  const fetchCoupons = async () => {
    const snap = await getDocs(couponsRef)
    setCoupons(
      snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          ...data,
          expiry:
            data.expiry instanceof Timestamp
              ? data.expiry.toDate()
              : new Date(data.expiry),
        }
      })
    )
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const couponData = {
        code: form.code,
        discount: Number(form.discount),
        maxDiscount: Number(form.maxDiscount),
        expiry: Timestamp.fromDate(new Date(form.expiry)),
        minPurchase: Number(form.minPurchase),
        allowedList: form.allowedList
          .split(',')
          .map((item) => item.trim())
          .filter((v) => v !== ''),
        notAllowedList: form.notAllowedList
          .split(',')
          .map((item) => item.trim())
          .filter((v) => v !== ''),
        status: form.status,
        type: form.type,
      }

      if (editingId) {
        await updateDoc(doc(db, 'coupons', editingId), couponData)
        setEditingId(null)
      } else {
        await addDoc(couponsRef, couponData)
      }

      setForm({
        code: '',
        discount: '',
        maxDiscount: '',
        expiry: '',
        minPurchase: '',
        allowedList: '',
        notAllowedList: '',
        status: 'active',
        type: 'general',
      })
      fetchCoupons()
    } catch (err) {
      console.error(err)
      alert('Error saving coupon')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      discount: coupon.discount,
      maxDiscount: coupon.maxDiscount || '',
      expiry: coupon.expiry.toISOString().slice(0, 16),
      minPurchase: coupon.minPurchase,
      allowedList: (coupon.allowedList || []).join(','),
      notAllowedList: (coupon.notAllowedList || []).join(','),
      status: coupon.status,
      type: coupon.type || 'general',
    })
    setEditingId(coupon.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return
    await deleteDoc(doc(db, 'coupons', id))
    fetchCoupons()
  }

  return (
    <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-3xl font-bold mb-8">Manage Coupons</h1>
  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-6 rounded-lg shadow">
            <input
              name="code"
              placeholder="Coupon Code"
              value={form.code}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
  
            <input
              type="number"
              name="discount"
              placeholder="Discount (%)"
              value={form.discount}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
  
            <input
              type="number"
              name="maxDiscount"
              placeholder="Max Discount (₹)"
              value={form.maxDiscount}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
  
            <input
              type="datetime-local"
              name="expiry"
              placeholder="Expiry"
              value={form.expiry}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
  
            <input
              type="number"
              name="minPurchase"
              placeholder="Minimum Purchase"
              value={form.minPurchase}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
  
            <input
              type="text"
              name="allowedList"
              placeholder="Allowed List (comma separated)"
              value={form.allowedList}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
  
            <input
              type="text"
              name="notAllowedList"
              placeholder="Not Allowed List (comma separated)"
              value={form.notAllowedList}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
  
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
  
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="regular">Regular</option>
              <option value="festive">Festive</option>
            </select>
  
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 transition px-6 py-2 rounded font-semibold disabled:opacity-50"
            >
              {editingId ? 'Update Coupon' : 'Add Coupon'}
            </button>
          </form>
        </div>
  
        {/* Right: Coupons List */}
        <div className="space-y-4">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="bg-gray-800 p-4 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {c.code} ({c.discount}% off, Max ₹{c.maxDiscount})
                </p>
                <p className="text-sm text-gray-400">
                  Min: ₹{c.minPurchase} | Exp: {c.expiry.toLocaleString()} |{' '}
                  {c.status} | Type: {c.type}
                </p>
                {c.allowedList?.length > 0 && (
                  <p className="text-xs text-green-400">
                    Allowed: {c.allowedList.join(', ')}
                  </p>
                )}
                {c.notAllowedList?.length > 0 && (
                  <p className="text-xs text-red-400">
                    Not Allowed: {c.notAllowedList.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
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