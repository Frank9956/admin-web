'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase/firebase'
import { deleteObject, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import {
    collection,
    getDocs,
    orderBy,
    query,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    arrayUnion,
} from 'firebase/firestore'
import { FaTrash, FaEdit, FaChevronDown } from 'react-icons/fa'

export default function OrdersListPage() {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [expandedHistory, setExpandedHistory] = useState({})
    const [editImageFile, setEditImageFile] = useState(null)
    const [editBillFile, setEditBillFile] = useState(null)

    const statuses = ['pending', 'packed', 'not packed', 'out for delivery', 'delivered']

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
            const snapshot = await getDocs(q)
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            setOrders(list)
        } catch (err) {
            console.error('Error fetching orders:', err)
        } finally {
            setLoading(false)
        }
    }

    const startEdit = (order) => {
        setEditingId(order.id)
        setEditForm({
            customerName: order.customerName || '',
            address: order.address || '',
            phone: order.phone || '',
            storeId: order.storeId || '',
            deliveryPartnerId: order.deliveryPartnerId || '',
            deliveryCharges: order.deliveryCharges || '',
            totalDiscount: order.totalDiscount || '',
            paidAmount: order.paidAmount || '',
            mapLink: order.mapLink || '', // ✅ Added mapLink
        })
        setEditImageFile(null)
        setEditBillFile(null)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditForm({})
        setEditImageFile(null)
        setEditBillFile(null)
    }

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value })
    }

    const saveEdit = async (orderId) => {
        try {
            const orderRef = doc(db, 'orders', orderId)
            const order = orders.find((o) => o.id === orderId)
            const updateData = { ...editForm }

            if (editImageFile) {
                if (order.groceryListImageUrl) {
                    try {
                        const oldImageRef = ref(storage, order.groceryListImageUrl)
                        await deleteObject(oldImageRef)
                    } catch (err) {
                        console.warn('Failed to delete old grocery image:', err)
                    }
                }
                const imageRef = ref(storage, `orders/${orderId}-grocery.jpg`)
                await uploadBytes(imageRef, editImageFile)
                updateData.groceryListImageUrl = await getDownloadURL(imageRef)
            }

            if (editBillFile) {
                if (order.orderBillUrl) {
                    try {
                        const oldBillRef = ref(storage, order.orderBillUrl)
                        await deleteObject(oldBillRef)
                    } catch (err) {
                        console.warn('Failed to delete old bill PDF:', err)
                    }
                }
                const billRef = ref(storage, `bills/${orderId}-bill.pdf`)
                updateData.orderBillUrl = await getDownloadURL(billRef)
            }

            await updateDoc(orderRef, updateData)
            setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updateData } : o)))
            cancelEdit()
        } catch (err) {
            console.error('Failed to update order:', err)
            alert('Failed to update order')
        }
    }

    const deleteOrder = async (orderId) => {
        if (!confirm('Are you sure you want to delete this order?')) return

        try {
            const orderRef = doc(db, 'orders', orderId)
            const orderSnap = await getDoc(orderRef)
            if (!orderSnap.exists()) return alert('Order not found')

            const orderData = orderSnap.data()
            const customerRef = doc(db, 'customers', orderData.phone)

            const customerSnap = await getDoc(customerRef)
            if (customerSnap.exists()) {
                const orderCount = Math.max((customerSnap.data().orderCount || 1) - 1, 0)
                await updateDoc(customerRef, { orderCount })
            }

            if (orderData.groceryListImageUrl) {
                try {
                    await deleteObject(ref(storage, orderData.groceryListImageUrl))
                } catch (err) {
                    console.warn('Could not delete grocery image:', err)
                }
            }

            if (orderData.orderBillUrl) {
                try {
                    await deleteObject(ref(storage, orderData.orderBillUrl))
                } catch (err) {
                    console.warn('Could not delete bill PDF:', err)
                }
            }

            await deleteDoc(orderRef)
            setOrders((prev) => prev.filter((o) => o.id !== orderId))
        } catch (err) {
            console.error('Failed to delete order:', err)
            alert('Failed to delete order')
        }
    }

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
                            statusHistory: [...(o.statusHistory || []), { status: newStatus, updatedAt: new Date(), updatedBy }],
                        }
                        : o
                )
            )
        } catch (err) {
            console.error('Failed to update status:', err)
            alert('Failed to update status')
        }
    }

    const toggleHistory = (id) => {
        setExpandedHistory((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    const getStatusButtonClass = (status) => {
        const colors = {
            pending: 'bg-yellow-500 text-black hover:bg-yellow-600',
            packed: 'bg-blue-600 text-white hover:bg-blue-700',
            'not packed': 'bg-red-600 text-white hover:bg-red-700',
            'out for delivery': 'bg-orange-500 text-black hover:bg-orange-600',
            delivered: 'bg-green-600 text-white hover:bg-green-700',
        }
        return colors[status] || 'bg-gray-600 text-white hover:bg-gray-700'
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.removeItem('isAdmin')
            router.replace('/admin-login')
        }, 600000)
        return () => clearTimeout(timer)
    }, [router])



    return (
        <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
            <nav className="mb-6 text-gray-400 text-sm">
                <ol className="flex list-reset">
                    <li>
                        <Link href="/dashboard" className="text-blue-400 hover:text-blue-500 underline">
                            Home
                        </Link>
                    </li>
                    <li className="mx-2">›</li>
                    <li className="text-gray-300">All Orders</li>
                </ol>
            </nav>

            <h1 className="text-3xl font-bold mb-8">All Orders</h1>

            {loading ? (
                <p>Loading...</p>
            ) : orders.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="border border-gray-700 rounded-lg p-6 bg-gray-800 relative">
                            <div className="absolute top-3 right-3 flex space-x-3">
                                <button onClick={() => startEdit(order)} className="p-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <FaEdit />
                                </button>
                                <button onClick={() => deleteOrder(order.id)} className="p-2 rounded bg-red-600 hover:bg-red-700 text-white">
                                    <FaTrash />
                                </button>
                            </div>

                            {editingId === order.id ? (
                                <>
                                    {[
                                        'customerName',
                                        'address',
                                        'phone',
                                        'storeId',
                                        'deliveryPartnerId',
                                        'totalDiscount',
                                        'deliveryCharges',
                                        'paidAmount',
                                        'mapLink', // ✅ editable field
                                    ].map((field) => (
                                        <input
                                            key={field}
                                            name={field}
                                            value={editForm[field]}
                                            onChange={handleEditChange}
                                            className="border border-gray-600 rounded bg-gray-700 px-3 py-2 my-1 w-full text-gray-100"
                                            placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                                        />
                                    ))}

                                    {/* File inputs skipped here for brevity (same as your version) */}

                                    <div className="mt-6 flex gap-4">
                                        <button onClick={() => saveEdit(order.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                                            Save
                                        </button>
                                        <button onClick={cancelEdit} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p><strong>Customer Name:</strong> {order.customerName}</p>
                                    <p><strong>Address:</strong> {order.address}</p>
                                    <p><strong>Phone:</strong> {order.phone}</p>
                                    <p><strong>Store ID:</strong> {order.storeId}</p>
                                    <p><strong>Delivery Partner ID:</strong> {order.deliveryPartnerId}</p>
                                    <p><strong>Paid Amount:</strong> {order.paidAmount}</p>
                                    {order.mapLink && (
                                        <p>
                                            <strong>Map Link:</strong>{' '}
                                            <a
                                                href={order.mapLink.startsWith('http') ? order.mapLink : `https://${order.mapLink}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 underline"
                                            >
                                                View Location
                                            </a>

                                        </p>
                                    )}


                                    {/* Show grocery list image button if exists */}
                                    {order.groceryListImageUrl && (
                                        <button
                                            onClick={() => window.open(order.groceryListImageUrl, '_blank')}
                                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                        >
                                            View Grocery List Image
                                        </button>
                                    )}

                                    {/* Show bill PDF button if exists */}
                                    {order.orderBillUrl && (
                                        <button
                                            onClick={() => window.open(order.orderBillUrl, '_blank')}
                                            className="mt-2 ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                        >
                                            View Bill PDF
                                        </button>
                                    )}

                                    <div className="mt-4">
                                        <p>
                                            <strong>Status:</strong>{' '}
                                            <span
                                                className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getStatusButtonClass(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
                                    </div>

                                    <button
                                        onClick={() => toggleHistory(order.id)}
                                        className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-200"
                                    >
                                        Status History
                                        <FaChevronDown
                                            className={`transition-transform ${expandedHistory[order.id] ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    {expandedHistory[order.id] && (
                                        <ul className="mt-2 text-sm max-h-40 overflow-auto space-y-1 border border-gray-700 rounded p-2 bg-gray-900">
                                            {(order.statusHistory || []).map((h, i) => (
                                                <li key={i}>
                                                    <strong>{h.status}</strong> —{' '}
                                                    {new Date(h.updatedAt.seconds * 1000).toLocaleString()} by{' '}
                                                    {h.updatedBy || 'unknown'}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
