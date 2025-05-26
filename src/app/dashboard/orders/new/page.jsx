'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { db, storage } from '@/lib/firebase'
import { addDoc, collection } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'

export default function NewOrderPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    customerName: '',
    address: '',
    phone: '',
    storeId: '',
    deliveryPartnerId: '',
  })
  const [imageFile, setImageFile] = useState(null) // Grocery list photo
  const [billFile, setBillFile] = useState(null) // Order bill photo (optional)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const orderId = `ORD-${uuidv4().slice(0, 6).toUpperCase()}`
    let groceryListImageUrl = ''
    let orderBillUrl = ''

    try {
      if (imageFile) {
        const imageRef = ref(storage, `orders/${orderId}.jpg`)
        await uploadBytes(imageRef, imageFile)
        groceryListImageUrl = await getDownloadURL(imageRef)
      }

      if (billFile) {
        // Changed to different folder 'bills/'
        const billRef = ref(storage, `bills/${orderId}-bill.pdf`)
        await uploadBytes(billRef, billFile)
        orderBillUrl = await getDownloadURL(billRef)
      }

      await addDoc(collection(db, 'orders'), {
        orderId,
        customerName: form.customerName,
        address: form.address,
        phone: form.phone,
        storeId: form.storeId,
        deliveryPartnerId: form.deliveryPartnerId,
        groceryListImageUrl,
        orderBillUrl,
        status: 'pending',
        createdAt: new Date(),
      })
      router.push('/dashboard/orders') // Redirect to orders list
    } catch (err) {
      console.error(err)
      alert('Failed to add order.')
    } finally {
      setLoading(false)
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
    <div className="p-8  mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      {/* Breadcrumb */}
      <nav className="mb-6 text-gray-400 text-sm" aria-label="Breadcrumb">
        <ol className="list-reset flex">
          <li>
            <Link href="/dashboard" className="text-blue-400 hover:text-blue-500 underline">
              Home
            </Link>
          </li>
          <li>
            <span className="mx-2">›</span>
          </li>
          <li>
            <Link href="/dashboard/orders" className="text-blue-400 hover:text-blue-500 underline">
              All Orders
            </Link>
          </li>
          <li>
            <span className="mx-2">›</span>
          </li>
          <li className="text-gray-300" aria-current="page">
            New Order
          </li>
        </ol>
      </nav>

      {/* Page title */}
      <h1 className="text-3xl font-bold mb-8">Create New Order</h1>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        {[
          { name: 'customerName', placeholder: 'Customer Name' },
          { name: 'address', placeholder: 'Address' },
          { name: 'phone', placeholder: 'Phone Number' },
          { name: 'storeId', placeholder: 'Store User ID' },
          { name: 'deliveryPartnerId', placeholder: 'Delivery Partner ID' },
        ].map(({ name, placeholder }) => (
          <input
            key={name}
            name={name}
            placeholder={placeholder}
            value={form[name]}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
          />
        ))}

        {/* Grocery List Photo */}
        <div>
          <label className="block mb-2 font-semibold">Grocery List Photo:</label>
          <div className="flex items-center gap-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium select-none transition"
            >
              Choose File
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <span className="text-gray-300 italic">
              {imageFile ? imageFile.name : 'No file chosen'}
            </span>
          </div>
        </div>

        {/* Order Bill (optional) */}
        <div>
          <label className="block mb-2 font-semibold">Order Bill (optional):</label>
          <div className="flex items-center gap-4">
            <label
              htmlFor="bill-upload"
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-white font-medium select-none transition"
            >
              Choose File
            </label>
            <input
              id="bill-upload"
              type="file"
              accept="pdf/*"
              onChange={(e) => setBillFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <span className="text-gray-300 italic">
              {billFile ? billFile.name : 'No file chosen'}
            </span>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 transition px-6 py-2 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Add Order'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-800 transition px-6 py-2 rounded font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
