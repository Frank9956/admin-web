import { db } from './firebase'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'

export const fetchOrders = async () => {
  const snapshot = await getDocs(collection(db, 'orders'))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const updateOrderStatus = async (orderId, newStatus) => {
  const orderRef = doc(db, 'orders', orderId)
  await updateDoc(orderRef, { status: newStatus })
}

export const updateOrderDetails = async (orderId, updatedData) => {
  const orderRef = doc(db, 'orders', orderId)
  await updateDoc(orderRef, updatedData)
}

export const deleteOrderById = async (orderId) => {
  const orderRef = doc(db, 'orders', orderId)
  await deleteDoc(orderRef)
}