'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase/firebase'
import { deleteObject } from 'firebase/storage'
import { getDoc } from 'firebase/firestore'
import {
    collection,
    getDocs,
    orderBy,
    query,
    doc,
    updateDoc,
    deleteDoc,
    arrayUnion,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { FaTrash, FaEdit, FaChevronDown, FaFilePdf  } from 'react-icons/fa'

export default function OrdersListPage() {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [expandedHistory, setExpandedHistory] = useState({})

    // New states to hold selected files during editing
    const [editImageFile, setEditImageFile] = useState(null)
    const [editBillFile, setEditBillFile] = useState(null)

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
            mapLink: order.mapLink || '',
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

            // Replace grocery image if new one is selected
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
                const groceryListImageUrl = await getDownloadURL(imageRef)
                updateData.groceryListImageUrl = groceryListImageUrl
            }

            if (editBillFile) {
                if (order.billPdfUrl || order.orderBillUrl) {
                    try {
                        const oldBillRef = ref(storage, order.billPdfUrl || order.orderBillUrl)
                        await deleteObject(oldBillRef)
                    } catch (err) {
                        console.warn('Failed to delete old bill PDF:', err)
                    }
                }

                const billRef = ref(storage, `bills/${orderId}-bill.pdf`)
                await uploadBytes(billRef, editBillFile)
                const billPdfUrl = await getDownloadURL(billRef)
                updateData.orderBillUrl = billPdfUrl // ✅ use orderBillUrl instead of billPdfUrl
            }

            await updateDoc(orderRef, updateData)

            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, ...updateData } : o))
            )

            setEditingId(null)
            setEditForm({})
            setEditImageFile(null)
            setEditBillFile(null)

        } catch (err) {
            console.error('Failed to update order:', err)
            alert('Failed to update order')
        }
    }


    const toggleHistory = (id) => {
        setExpandedHistory((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    const goToInvoice = (orderId) => {
        // redirect with orderId as query param
        router.push(`/dashboard/invoice?orderId=${orderId}`);
      };

    const deleteOrder = async (orderId) => {
        if (confirm('Are you sure you want to delete this order?')) {
            try {
                const orderRef = doc(db, 'orders', orderId)
                const orderSnap = await getDoc(orderRef)

                if (!orderSnap.exists()) {
                    alert('Order not found')
                    return
                }

                const orderData = orderSnap.data()
                const customerPhone = orderData.phone
                const customerRef = doc(db, 'customers', customerPhone)

                // Decrease customer's order count
                const customerSnap = await getDoc(customerRef)
                if (customerSnap.exists()) {
                    const customerData = customerSnap.data()
                    const newCount = Math.max((customerData.orderCount || 1) - 1, 0)
                    await updateDoc(customerRef, { orderCount: newCount })
                }

                // Delete grocery image from storage
                if (orderData.groceryListImageUrl) {
                    try {
                        const groceryRef = ref(storage, orderData.groceryListImageUrl)
                        await deleteObject(groceryRef)
                    } catch (err) {
                        console.warn('Could not delete grocery image:', err)
                    }
                }

                // Delete bill PDF from storage
                if (orderData.orderBillUrl) {
                    try {
                        const billRef = ref(storage, orderData.orderBillUrl)
                        await deleteObject(billRef)
                    } catch (err) {
                        console.warn('Could not delete bill PDF:', err)
                    }
                }

                // Finally delete the order
                await deleteDoc(orderRef)

                setOrders((prev) => prev.filter((o) => o.id !== orderId))
            } catch (err) {
                console.error('Failed to delete order:', err)
                alert('Failed to delete order')
            }
        }
    }


    const getStatusButtonClass = (status) => {
        let btnColor = ''
        switch (status) {
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
        return btnColor
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
                    <li className="text-gray-300" aria-current="page">
                        All Orders
                    </li>
                </ol>
            </nav>

            <h1 className="text-3xl font-bold mb-8">All Orders</h1>

            {loading ? (
                <p>Loading orders...</p>
            ) : orders.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="relative border border-gray-700 rounded-lg p-6 shadow bg-gray-800"
                        >
                            <div className="absolute top-3 right-3 flex space-x-3">
                                <button
                                    onClick={() => goToInvoice(order.id)}
                                    title="Delete Order"
                                    className="p-2 rounded bg-red-600 hover:bg-red-700 transition text-white"
                                >
                                    <FaFilePdf />
                                </button>
                                <button
                                    onClick={() => startEdit(order)}
                                    title="Edit Order"
                                    className="p-2 rounded bg-indigo-600 hover:bg-indigo-700 transition text-white"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => deleteOrder(order.id)}
                                    title="Delete Order"
                                    className="p-2 rounded bg-red-600 hover:bg-red-700 transition text-white"
                                >
                                    <FaTrash />
                                </button>
                            </div>

                            <p className="mb-2">
                                <strong>Order ID:</strong> {order.orderId}
                            </p>

                            {editingId === order.id ? (
                                <>
                                    {/* Existing input fields */}
                                    {[
                                        'customerName',
                                        'address',
                                        'phone',
                                        'storeId',
                                        'deliveryPartnerId',
                                        'totalDiscount',
                                        'deliveryCharges',
                                        'paidAmount',
                                        'mapLink',
                                    ].map((field) => (
                                        <input
                                            key={field}
                                            name={field}
                                            value={editForm[field]}
                                            onChange={handleEditChange}
                                            className="border border-gray-600 rounded bg-gray-700 px-3 py-2 my-1 w-full text-gray-100 placeholder-gray-400"
                                            placeholder={field
                                                .replace(/([A-Z])/g, ' $1')
                                                .replace(/^./, (str) => str.toUpperCase())}
                                        />
                                    ))}

                                    {/* Grocery List Image file input */}
                                    <div className="mt-4">
                                        <label className="block mb-1 font-semibold">Grocery List Photo (image):</label>
                                        <div className="flex items-center gap-4">
                                            <label
                                                htmlFor="edit-grocery-image"
                                                className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium select-none transition"
                                            >
                                                Choose Image
                                            </label>
                                            <input
                                                id="edit-grocery-image"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                            <span className="text-gray-300 italic">
                                                {editImageFile
                                                    ? editImageFile.name
                                                    : order.groceryListImageUrl
                                                        ? 'Existing image retained'
                                                        : 'No file chosen'}
                                            </span>
                                        </div>
                                        {/* Show existing image button */}
                                        {order.groceryListImageUrl && !editImageFile && (
                                            <button
                                                type="button"
                                                onClick={() => window.open(order.groceryListImageUrl, '_blank')}
                                                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                            >
                                                View Current Grocery List Image
                                            </button>
                                        )}
                                    </div>

                                    {/* Bill PDF file input */}
                                    <div className="mt-4">
                                        <label className="block mb-1 font-semibold">Order Bill (PDF):</label>
                                        <div className="flex items-center gap-4">
                                            <label
                                                htmlFor="edit-bill-pdf"
                                                className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium select-none transition"
                                            >
                                                Choose PDF
                                            </label>
                                            <input
                                                id="edit-bill-pdf"
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(e) => setEditBillFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                            <span className="text-gray-300 italic">
                                                {editBillFile
                                                    ? editBillFile.name
                                                    : order.billPdfUrl
                                                        ? 'Existing PDF retained'
                                                        : 'No file chosen'}
                                            </span>
                                        </div>
                                        {/* Show existing bill PDF button */}
                                        {order.orderBillUrl && !editBillFile && (
                                            <button
                                                type="button"
                                                onClick={() => window.open(order.orderBillUrl, '_blank')}
                                                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                            >
                                                View Current Bill PDF
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-6 flex space-x-4">
                                        <button
                                            onClick={() => saveEdit(order.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p>
                                        <strong>Customer Name:</strong> {order.customerName}
                                    </p>
                                    <p>
                                        <strong>Address:</strong> {order.address}
                                    </p>
                                    <p>
                                        <strong>Phone:</strong> {order.phone}
                                    </p>
                                    <p>
                                        <strong>Store ID:</strong> {order.storeId}
                                    </p>
                                    <p>
                                        <strong>Delivery Partner ID:</strong> {order.deliveryPartnerId}
                                    </p>
                                    <p>
                                        <strong>Paid Amount:</strong> {order.paidAmount}
                                    </p>
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

