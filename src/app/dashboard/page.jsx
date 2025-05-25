'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'
import Link from 'next/link'

export default function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showImageIds, setShowImageIds] = useState({})

  const statuses = [
    'pending',
    'packed',
    'not packed',
    'out for delivery',
    'delivered',
  ]

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setOrders(list)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const countByStatus = (status) =>
    orders.filter((order) => order.status === status).length

  const updateStatus = async (orderId, newStatus, updatedBy = 'admin') => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        status: newStatus,
        statusHistory: arrayUnion({
          status: newStatus,
          updatedAt: new Date(),
          updatedBy,
        }),
      })
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
              ...o,
              status: newStatus,
              statusHistory: [
                ...(o.statusHistory || []),
                { status: newStatus, updatedAt: new Date(), updatedBy },
              ],
            }
            : o
        )
      )
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update status')
    }
  }

  const toggleImage = (orderId) => {
    setShowImageIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  const activeOrders = orders.filter((order) => order.status !== 'delivered')

  return (
    <div className="p-8  mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-blue-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Total Orders</h2>
          <p className="text-4xl font-bold">{orders.length}</p>
        </div>

        <div className="bg-yellow-600 rounded-lg p-6 shadow ">
          <h2 className="text-xl font-semibold mb-2">Pending Orders</h2>
          <p className="text-4xl font-bold">{countByStatus('pending')}</p>
        </div>

        <div className="bg-green-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Delivered Orders</h2>
          <p className="text-4xl font-bold">{countByStatus('delivered')}</p>
        </div>

        <div className="bg-indigo-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Packed Orders</h2>
          <p className="text-4xl font-bold">{countByStatus('packed')}</p>
        </div>

        <div className="bg-red-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Not Packed Orders</h2>
          <p className="text-4xl font-bold">{countByStatus('not packed')}</p>
        </div>

        <div className="bg-orange-600 rounded-lg p-6 shadow ">
          <h2 className="text-xl font-semibold mb-2">Out for Delivery</h2>
          <p className="text-4xl font-bold">{countByStatus('out for delivery')}</p>
        </div>
      </div>

      {/* New Order and View All Orders Buttons */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Link
          href="/dashboard/orders/new"
          className="bg-black text-white px-5 py-3 rounded hover:bg-gray-800 transition inline-block text-center"
        >
          + Add New Order
        </Link>

        <Link
          href="/dashboard/orders"
          className="bg-gray-700 text-white px-5 py-3 rounded hover:bg-gray-900 transition"
        >
          View All Orders
        </Link>
      </div>

      
      {/* Active Orders List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Orders to Process</h2>
        {loading ? (
          <p>Loading orders...</p>
        ) : activeOrders.length === 0 ? (
          <p>No active orders to process.</p>
        ) : (
          <div className="space-y-6">
            {activeOrders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className="border rounded p-4 shadow bg-gray-800 text-gray-100"
              >
                <p>
                  <strong>Order ID:</strong> {order.orderId}
                </p>
                <p>
                  <strong>Customer:</strong> {order.customerName}
                </p>
                <p>
                  <strong>Address:</strong> {order.address}
                </p>
                <p>
                  <strong>Phone:</strong>{' '}
                  <a href={`tel:${order.phone}`} className="text-blue-400 underline">
                    {order.phone}
                  </a>
                </p>
                <p>
                  <strong>Store ID:</strong> {order.storeId || 'N/A'}
                </p>
                <p>
                  <strong>Delivery Partner ID:</strong> {order.deliveryPartnerId || 'N/A'}
                </p>

                {/* Grocery List Image */}
                {order.groceryListImageUrl && (
                  <button
                    onClick={() => window.open(order.groceryListImageUrl, '_blank')}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    View Grocery List Image
                  </button>
                )}

                {/* Bill PDF */}
                {order.billPdfUrl && (
                  <button
                    onClick={() => window.open(order.billPdfUrl, '_blank')}
                    className="mt-2 ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    View Bill PDF
                  </button>
                )}

                <p className="mt-4">
                  <strong>Status:</strong>{' '}
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-semibold capitalize ${order.status === 'pending'
                        ? 'bg-yellow-500 text-black'
                        : order.status === 'packed'
                          ? 'bg-blue-600 text-white'
                          : order.status === 'not packed'
                            ? 'bg-red-600 text-white'
                            : order.status === 'out for delivery'
                              ? 'bg-orange-500 text-black'
                              : order.status === 'delivered'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-white'
                      }`}
                  >
                    {order.status}
                  </span>
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {statuses
                    .filter((s) => s !== order.status)
                    .map((s) => {
                      let btnColor = ''
                      switch (s) {
                        case 'pending':
                          btnColor = 'bg-yellow-500 text-black hover:bg-yellow-600'
                          break
                        case 'packed':
                          btnColor = 'bg-blue-600 text-white hover:bg-blue-700'
                          break
                        case 'not packed':
                          btnColor = 'bg-red-600 text-white hover:bg-red-700'
                          break
                        case 'out for delivery':
                          btnColor = 'bg-orange-500 text-black hover:bg-orange-600'
                          break
                        case 'delivered':
                          btnColor = 'bg-green-600 text-white hover:bg-green-700'
                          break
                        default:
                          btnColor = 'bg-gray-600 text-white hover:bg-gray-700'
                      }
                      return (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.id, s)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${btnColor}`}
                        >
                          Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      )
                    })}
                </div>

                {/* Status History toggle */}
                <button
                  onClick={() =>
                    setShowImageIds((prev) => ({
                      ...prev,
                      [`history-${order.id}`]: !prev[`history-${order.id}`],
                    }))
                  }
                  className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-200"
                >
                  Status History
                  <svg
                    className={`w-4 h-4 transition-transform ${showImageIds[`history-${order.id}`] ? 'rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showImageIds[`history-${order.id}`] && (
                  <ul className="mt-2 text-sm max-h-40 overflow-auto space-y-1 border border-gray-700 rounded p-2 bg-gray-900">
                    {(order.statusHistory || []).map((h, i) => (
                      <li key={i}>
                        <strong>{h.status}</strong> —{' '}
                        {new Date(h.updatedAt.seconds ? h.updatedAt.seconds * 1000 : h.updatedAt).toLocaleString()}{' '}
                        by {h.updatedBy || 'unknown'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
