'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { db, storage } from '@/lib/firebase/firebase'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'

export default function NewOrderPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    customerName: '',
    address: '',
    phone: '',
    mapLink: '',
    storeId: '',
    deliveryPartnerId: '',
    couponCode: '',
    addressType: 'myself',
    friendFamilyName: '',
    friendFamilyPhone: '',
    deliveryType: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [billFile, setBillFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const [productList, setProductList] = useState([])
  const [suggestions, setSuggestion] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const checkCustomerByPhone = async (phone) => {
    if (!phone) return
    const customerRef = doc(db, 'customers', phone)
    const customerSnap = await getDoc(customerRef)

    if (customerSnap.exists()) {
      const customer = customerSnap.data()
      setForm((prev) => ({
        ...prev,
        mapLink: customer.mapLink,
      }))
    } else {
      console.log('New customer')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const now = new Date();
    const orderId = `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    let groceryListImageUrl = ''
    let orderBillUrl = ''
    const customerPhone = form.phone
    const customerRef = doc(db, 'customers', customerPhone)

    try {
      if (imageFile) {
        const imageRef = ref(storage, `orders/${orderId}.jpg`)
        await uploadBytes(imageRef, imageFile)
        groceryListImageUrl = await getDownloadURL(imageRef)
      }

      if (billFile) {
        const billRef = ref(storage, `bills/${orderId}-bill.pdf`)
        await uploadBytes(billRef, billFile)
        orderBillUrl = await getDownloadURL(billRef)
      }

      const customerSnap = await getDoc(customerRef)
      if (customerSnap.exists()) {
        await updateDoc(customerRef, {
          orderCount: (customerSnap.data().orderCount || 0) + 1,
        })
      } else {
        await setDoc(customerRef, {
          name: form.customerName,
          address: form.address,
          phone: form.phone,
          mapLink: form.mapLink,
          customerId: `CUS-${uuidv4().slice(0, 6).toUpperCase()}`,
          orderCount: 1,
        })
      }

      await setDoc(doc(db, 'orders', orderId), {
        orderId,
        customerName: form.customerName,
        address: form.address,
        phone: form.phone,
        mapLink: form.mapLink,
        storeId: form.storeId,
        deliveryPartnerId: form.deliveryPartnerId,
        couponCode: form.couponCode,
        addressType: form.addressType,
        friendFamilyName: form.addressType === 'friends_family' ? form.friendFamilyName : '',
        friendFamilyPhone: form.addressType === 'friends_family' ? form.friendFamilyPhone : '',
        deliveryType: form.deliveryType,
        groceryListImageUrl,
        orderBillUrl,
        status: 'pending',
        createdAt: new Date(),
        totalDiscount: '',
        deliveryCharges: '',
        // Save productList and suggestions also
        productList,
        suggestions,
      })

      router.push('/dashboard/orders')
    } catch (err) {
      console.error('handleSubmit error:', err)
      alert('Failed to add order. See console for details.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const data = localStorage.getItem('newOrderData')
    if (data) {
      const parsed = JSON.parse(data)
      setForm(parsed)
      setProductList(parsed.productList || [])
      setSuggestion(parsed.suggestions || '')
      localStorage.removeItem('newOrderData')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.removeItem('isAdmin')
      router.replace('/admin-login')
    }, 600000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="p-8  mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      <nav className="mb-6 text-gray-400 text-sm" aria-label="Breadcrumb">
        <ol className="list-reset flex">
          <li>
            <Link href="/dashboard" className="text-blue-400 hover:text-blue-500 underline">
              Home
            </Link>
          </li>
          <li><span className="mx-2">›</span></li>
          <li>
            <Link href="/dashboard/orders" className="text-blue-400 hover:text-blue-500 underline">
              All Orders
            </Link>
          </li>
          <li><span className="mx-2">›</span></li>
          <li className="text-gray-300" aria-current="page">New Order</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold mb-8">Create New Order</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">

        <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
          {/* Phone input with customer autofill */}
          <input
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            onBlur={(e) => checkCustomerByPhone(e.target.value)}
            required
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
          />

          {/* Customer Name + Address */}
          <input
            name="customerName"
            placeholder="Customer Name"
            value={form.customerName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
          />
          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
          />

          <div className="flex gap-2">
            <input
              name="mapLink"
              placeholder="Google Map Link"
              value={form.mapLink}
              onChange={handleChange}

              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
            />

            <button
              type="button" // prevent form submit
              onClick={() => checkCustomerByPhone(form.phone)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Check
            </button>
          </div>

          {/* Coupon Code */}
          <input
            name="couponCode"
            placeholder="Coupon Code"
            value={form.couponCode}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
          />

          {/* Address Type */}
          <div>
            <label className="block mb-2 font-semibold">Address Type:</label>
            <select
              name="addressType"
              value={form.addressType}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
            >
              <option value="myself">Myself</option>
              <option value="friends_family">Friends / Family</option>
            </select>
          </div>

          {/* Extra fields for friends/family */}
          {form.addressType === 'friends_family' && (
            <>
              <input
                name="friendFamilyName"
                placeholder="Friend/Family Name"
                value={form.friendFamilyName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
              />
              <input
                name="friendFamilyPhone"
                placeholder="Friend/Family Phone"
                value={form.friendFamilyPhone}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
              />
            </>
          )}

          {/* Delivery Type */}
          <input
            name="deliveryType"
            placeholder="Delivery Type (e.g. Same Day, Express)"
            value={form.deliveryType}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
          />

          {/* Store + Delivery Partner IDs */}
          <input
            name="storeId"
            placeholder="Store User ID"
            value={form.storeId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
          />
          <input
            name="deliveryPartnerId"
            placeholder="Delivery Partner ID"
            value={form.deliveryPartnerId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
          />

          {/* File Uploads */}
          <div>
            <label className="block mb-2 font-semibold">Grocery List Photo:</label>
            <div className="flex items-center gap-4">
              <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium select-none transition">
                Choose File
              </label>
              <input id="file-upload" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" />
              <span className="text-gray-300 italic">{imageFile ? imageFile.name : 'No file chosen'}</span>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Order Bill (optional):</label>
            <div className="flex items-center gap-4">
              <label htmlFor="bill-upload" className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-white font-medium select-none transition">
                Choose File
              </label>
              <input id="bill-upload" type="file" accept="application/pdf" onChange={(e) => setBillFile(e.target.files?.[0] || null)} className="hidden" />
              <span className="text-gray-300 italic">{billFile ? billFile.name : 'No file chosen'}</span>
            </div>
          </div>

          {/* Submit + Cancel */}
          <div className="flex gap-4 mt-6">
            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 transition px-6 py-2 rounded font-semibold disabled:opacity-50">
              {loading ? 'Submitting...' : 'Add Order'}
            </button>

            <button type="button" onClick={() => router.back()} className="bg-gray-700 hover:bg-gray-800 transition px-6 py-2 rounded font-semibold">
              Cancel
            </button>
          </div>
        </form>

        {/* Right Side: Product List + suggestions */}
        <div className="bg-gray-800 p-6 rounded space-y-4">
          <h2 className="text-xl font-semibold">Products</h2>
          {productList.length > 0 ? (
            <ul className="space-y-2">
              {productList.map((p, idx) => (
                <li key={idx} className="flex justify-between border-b border-gray-600 pb-2">
                  <span>{p.name} - {p.weight} | No. of Units = {p.quantity}</span>
                  <span className="font-bold">₹{p.price} × {p.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic">No products added.</p>
          )}

          <div>
            <h2 className="text-xl font-semibold mt-6">Suggestions</h2>
            <p className="text-gray-300">{suggestions || 'No suggestions provided.'}</p>
          </div>

        </div>
      </div>
    </div>
  )
}
