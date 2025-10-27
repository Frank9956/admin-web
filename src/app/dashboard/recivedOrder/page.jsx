'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/firebase'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { sendOrderConfirmation } from '@/utils/whatsapp'

export default function ReceivedOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [billLinks, setBillLinks] = useState({})

  const router = useRouter()

  const [newProductId, setNewProductId] = useState('')
  const [newProductDetails, setNewProductDetails] = useState(null)
  const [newQuantity, setNewQuantity] = useState(1)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'receivedOrder'), orderBy('createdAt', 'desc'))
      const orderSnap = await getDocs(q)
      const ordersData = []
      for (let orderDoc of orderSnap.docs) {
        const order = orderDoc.data()
        const products = Array.isArray(order.productList) ? order.productList : []
        ordersData.push({ id: orderDoc.id, ...order, productList: products })
      }
      setOrders(ordersData)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleDeleteOrder = async (id) => {
    if (!confirm('Delete this order?')) return
    await deleteDoc(doc(db, 'receivedOrder', id))
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  const handleFetchProduct = async () => {
    if (!newProductId) return
    const productRef = doc(db, 'products', newProductId)
    const productSnap = await getDoc(productRef)
    if (productSnap.exists()) {
      const product = productSnap.data()
      setNewProductDetails({
        productId: newProductId,
        name: product.name,
        weight: product.weight,
        price: product.price,
        imageUrl: product.imageUrl || '',
      })
    } else {
      alert('Product not found')
      setNewProductDetails(null)
    }
  }

  const handleCreateOrder = (order) => {
    const orderData = { ...order }
    delete orderData.createdAt

    const mappedData = {
      customerName: orderData.name || '',
      phone: orderData.phone || '',
      address: orderData.address || '',
      mapLink: orderData.mapLink || '',
      storeId: orderData.storeId || '',
      deliveryPartnerId: orderData.deliveryPartnerId || '',
      couponCode: orderData.couponCode || '',
      addressType: orderData.addressType || 'myself',
      friendFamilyName: orderData.friendFamilyName || '',
      friendFamilyPhone: orderData.friendFamilyPhone || '',
      deliveryType: orderData.deliveryType || '',
      suggestions: orderData.suggestions || '',
      productList: orderData.productList || [],
    }

    localStorage.setItem('newOrderData', JSON.stringify(mappedData))
    router.push('/dashboard/orders/new')
  }

  const handleAddProduct = (orderId) => {
    if (!newProductDetails || !newQuantity) return

    const newItem = {
      ...newProductDetails,
      quantity: newQuantity,
      total: newProductDetails.price * newQuantity,
    }

    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          const updatedProducts = [...order.productList, newItem]
          const newTotal = order.totalPrice + newItem.total

          return {
            ...order,
            productList: updatedProducts,
            totalPrice: newTotal,
            updated: true,
          }
        }
        return order
      })
    )

    setNewProductId('')
    setNewProductDetails(null)
    setNewQuantity(1)
  }

  const handleDeleteProduct = (orderId, productId) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          const product = order.productList.find((p) => p.productId === productId)
          const updatedProducts = order.productList.filter((p) => p.productId !== productId)
          const newTotal = order.totalPrice - (product?.total || 0)

          return {
            ...order,
            productList: updatedProducts,
            totalPrice: newTotal,
            updated: true,
          }
        }
        return order
      })
    )
  }

  const handleSaveOrder = async (orderId) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    await updateDoc(doc(db, 'receivedOrder', orderId), {
      productList: order.productList,
      totalPrice: order.totalPrice,
    })

    setEditingOrderId(null)
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, updated: false } : o))
    )
  }

  // ✅ Update order status in Firestore
  const handleStatusChange = async (orderId, status) => {
    await updateDoc(doc(db, 'receivedOrder', orderId), { status })
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    )
  }

  // ✅ Save Bill Receipt Link
  const handleSaveBillLink = async (orderId) => {
    const link = billLinks[orderId]
    if (!link) return alert('Please enter a link first.')
    await updateDoc(doc(db, 'receivedOrder', orderId), { billReceipt: link })
    alert('Bill receipt link updated ✅')
  }

  return (
    <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-3xl font-bold mb-8">Received Orders</h1>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No received orders found.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-800 p-6 rounded shadow-md relative">
              <button
                onClick={() => handleDeleteOrder(order.id)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
              >
                Delete
              </button>

              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {order.name} ({order.phone})
                  </h2>
                  <p className="text-gray-300">Address: {order.address}</p>
                  <p className="text-gray-300">Delivery: {order.deliveryType}</p>
                  <p className="text-gray-300">Coupon: {order.couponCode || 'None'}</p>
                  <p className="text-gray-300">Total Price: ₹{order.totalPrice}</p>
                  <p className="text-gray-400 text-sm">
                    Created At: {new Date(order.createdAt.seconds * 1000).toLocaleString()}
                  <p className="text-gray-300">Requirement: {order.suggestions || 'None'}</p>
                  </p>
                </div>

                {/* ✅ Status Radio Buttons */}
                <div className="flex flex-col items-end space-y-2 mt-5">
                  <h3 className="font-semibold mb-1">Status:</h3>
                  {['processing', 'out for delivery', 'delivered'].map((status) => (
                    <label key={status} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`status-${order.id}`}
                        value={status}
                        checked={order.status === status}
                        onChange={() => handleStatusChange(order.id, status)}
                      />
                      <span>{status}</span>
                    </label>
                  ))}

                  {/* ✅ Bill Receipt Input */}
                  <div className="mt-3 w-60">
                    <input
                      type="text"
                      placeholder="Enter Bill Receipt Link"
                      value={billLinks[order.id] || order.billReceipt || ''}
                      onChange={(e) =>
                        setBillLinks((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded"
                    />
                    <button
                      onClick={() => handleSaveBillLink(order.id)}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Save Bill Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Product List */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Products:</h3>
                {order.productList?.length > 0 ? (
                  <ul className="list-disc ml-6 space-y-1">
                    {order.productList.map((p) => (
                      <li key={p.productId} className="flex justify-between items-center">
                        <span>
                          {p.name} - {p.weight} - ₹{p.price} × {p.quantity}
                        </span>
                        {editingOrderId === order.id && (
                          <button
                            onClick={() => handleDeleteProduct(order.id, p.productId)}
                            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-gray-400">No products found</p>
                )}
              </div>

              {/* Action Buttons */}
              {editingOrderId === order.id ? (
                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    value={newProductId}
                    onChange={(e) => setNewProductId(e.target.value)}
                    placeholder="Enter Product ID"
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"
                  />
                  <button
                    onClick={handleFetchProduct}
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded font-semibold"
                  >
                    Fetch Product
                  </button>

                  {newProductDetails && (
                    <div className="bg-gray-700 p-3 rounded space-y-2">
                      <p>
                        {newProductDetails.name} - {newProductDetails.weight} - ₹
                        {newProductDetails.price}
                      </p>
                      <input
                        type="number"
                        min="1"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded bg-gray-600 border border-gray-500"
                      />
                      <p>Total: ₹{newProductDetails.price * newQuantity}</p>
                      <button
                        onClick={() => handleAddProduct(order.id)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
                      >
                        Add Product
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleSaveOrder(order.id)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleCreateOrder(order)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
                  >
                    Create Order
                  </button>
                  <button
                    onClick={() => sendOrderConfirmation(order)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold"
                  >
                    Send Confirmation
                  </button>
                  <button
                    onClick={() => setEditingOrderId(order.id)}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-semibold"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
