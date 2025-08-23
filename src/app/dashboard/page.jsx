'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase/firebase'
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
import { sendCustomDeliveryNotification } from '@/lib/firebase/sendDeliveryNotification'
import { sendCustomStoreNotification } from '@/lib/firebase/sendStoreNotification'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"


export default function AdminDashboard() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showImageIds, setShowImageIds] = useState({})
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)

  const statuses = ['pending', 'packed', 'not packed', 'out for delivery', 'delivered']

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin')
    if (isAdmin === 'true') {
      setAuthorized(true)
    } else {
      router.replace('/admin-login')
    }
    setCheckingAuth(false)
  }, [])

  useEffect(() => {
    if (!authorized) return
    const interval = setInterval(() => {
      localStorage.removeItem('isAdmin')
      router.replace('/admin-login')
    }, 600000)
    return () => clearInterval(interval)
  }, [authorized, router])

  useEffect(() => {
    if (authorized) fetchOrders()
  }, [authorized])

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

  const handleSendDeliveryNotification = async () => {
    if (!title || !body) return alert("Both title and body are required.")
    setSending(true)
    try {
      await sendCustomDeliveryNotification({ title, body })
      alert("✅ Notification sent to Delivery")
    } catch (err) {
      console.error("❌ Delivery notification error:", err)
      alert("❌ Failed to send Delivery notification")
    } finally {
      setSending(false)
    }
  }

  const handleSendStoreNotification = async () => {
    if (!title || !body) return alert("Both title and body are required.")
    setSending(true)
    try {
      await sendCustomStoreNotification({ title, body })
      alert("✅ Notification sent to Store")
    } catch (err) {
      console.error("❌ Store notification error:", err)
      alert("❌ Failed to send Store notification")
    } finally {
      setSending(false)
    }
  }

  if (checkingAuth || !authorized) return null

  const activeOrders = orders.filter((order) => order.status !== 'delivered')

  return (
    <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100 relative">
      {/* Header with Notification Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => setShowNotificationModal(true)}
          className="relative"
          title="Send Notification"
        >
          <svg
            className="w-8 h-8 text-gray-200 hover:text-white transition"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405C18.21 14.79 18 13.918 18 13V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v2c0 .918-.21 1.79-.595 2.595L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div className="bg-white text-black rounded-lg p-6 w-full max-w-md shadow-lg relative">
            <button
              onClick={() => setShowNotificationModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border mb-3 rounded"
            />
            <textarea
              placeholder="Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2 border mb-3 rounded"
            />
            <button
              onClick={handleSendDeliveryNotification}
              disabled={sending}
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
            >
              {sending ? "Sending..." : "Send to Delivery"}
            </button>
            <button
              onClick={handleSendStoreNotification}
              disabled={sending}
              className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition mt-2"
            >
              {sending ? "Sending..." : "Send to Store"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-blue-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Total Orders</h2>
          <p className="text-4xl font-bold">{orders.length}</p>
        </div>

        <div className="bg-indigo-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Packed Orders</h2>
          <p className="text-4xl font-bold">{countByStatus('packed')}</p>
        </div>

        <div className="bg-orange-600 rounded-lg p-6 shadow ">
          <h2 className="text-xl font-semibold mb-2">Out for Delivery</h2>
          <p className="text-4xl font-bold">{countByStatus('out for delivery')}</p>
        </div>

        <div className="bg-yellow-600 rounded-lg p-6 shadow ">
          <h2 className="text-xl font-semibold mb-2">Pending Orders</h2>
          <p className="text-4xl font-bold">{countByStatus('pending')}</p>
        </div>

        <div className="bg-red-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Not Packed Orders</h2>
          <p className="text-4xl font-bold">{countByStatus('not packed')}</p>
        </div>

        <div className="bg-green-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Delivered Orders</h2>
          <p className="text-4xl font-bold">{countByStatus('delivered')}</p>
        </div>

      </div>

      {/* Buttons */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Link
          href="/dashboard/orders/new"
          className="bg-black text-white px-5 py-3 rounded hover:bg-gray-800"
        >
          + Add New Order
        </Link>

        <Link
          href="/dashboard/orders"
          className="bg-gray-700 text-white px-5 py-3 rounded hover:bg-gray-900"
        >
          View All Orders
        </Link>
        
        <Link
          href="/dashboard/recivedOrder"
          className="bg-gray-700 text-white px-5 py-3 rounded hover:bg-gray-900"
        >
          Recived Order
        </Link>

        <Link
          href="/dashboard/catalog"
          className="bg-gray-700 text-white px-5 py-3 rounded hover:bg-gray-900"
        >
          Catalog
        </Link>


        {/* Dropdown for extra links */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gray-700 text-white px-15 py-6 rounded hover:bg-gray-900 flex items-center">
              More <ChevronDown className="ml-10 h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 text-white rounded-lg p-2">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/customers">View All Customers</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/users">View All Users</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/invoice">Invoice</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/coupons">Coupons</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/announcements">Announcements</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Orders */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Orders to Process</h2>
        {loading ? (
          <p>Loading orders...</p>
        ) : activeOrders.length === 0 ? (
          <p>No active orders to process.</p>
        ) : (
          <div className="space-y-6">
            {activeOrders.slice(0, 10).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                statuses={statuses}
                updateStatus={updateStatus}
                showImageIds={showImageIds}
                setShowImageIds={setShowImageIds}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// Reusable Stat Card Component
const StatCard = ({ title, count, color }) => (
  <div className={`bg-${color} rounded-lg p-6 shadow`}>
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <p className="text-4xl font-bold">{count}</p>
  </div>
)

// Reusable Order Card Component
const OrderCard = ({ order, statuses, updateStatus, showImageIds, setShowImageIds }) => (
  <div className="border rounded p-4 shadow bg-gray-800 text-gray-100">
    <p><strong>Order ID:</strong> {order.orderId}</p>
    <p><strong>Customer:</strong> {order.customerName}</p>
    <p><strong>Address:</strong> {order.address}</p>
    <p>
      <strong>Phone:</strong> <a href={`tel:${order.phone}`} className="text-blue-400 underline">{order.phone}</a>
    </p>
    <p><strong>Store ID:</strong> {order.storeId || 'N/A'}</p>
    <p><strong>Delivery Partner ID:</strong> {order.deliveryPartnerId || 'N/A'}</p>
    {order.mapLink && (
      <p className="mt-2">
        <a
          href={order.mapLink.startsWith('http') ? order.mapLink : `https://${order.mapLink}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline"
        >
          Map Location
        </a>
      </p>
    )}


    {order.groceryListImageUrl && (
      <button
        onClick={() => window.open(order.groceryListImageUrl, '_blank')}
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
      >
        View Grocery List Image
      </button>
    )}

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
      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold capitalize ${order.status === 'pending'
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
        }`}>
        {order.status}
      </span>
    </p>

    <div className="mt-3 flex flex-wrap gap-2">
      {statuses.filter((s) => s !== order.status).map((s) => {
        const colors = {
          pending: 'bg-yellow-500 text-black hover:bg-yellow-600',
          packed: 'bg-blue-600 text-white hover:bg-blue-700',
          'not packed': 'bg-red-600 text-white hover:bg-red-700',
          'out for delivery': 'bg-orange-500 text-black hover:bg-orange-600',
          delivered: 'bg-green-600 text-white hover:bg-green-700',
        }
        return (
          <button
            key={s}
            onClick={() => updateStatus(order.id, s)}
            className={`px-3 py-1 rounded text-sm font-semibold ${colors[s]}`}
          >
            Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        )
      })}
    </div>

    {/* Status History */}
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
            {new Date(h.updatedAt.seconds ? h.updatedAt.seconds * 1000 : h.updatedAt).toLocaleString()} by {h.updatedBy || 'unknown'}
          </li>
        ))}
      </ul>
    )}
  </div>
)
