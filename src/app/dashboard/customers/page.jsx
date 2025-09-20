'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/firebase'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { FaTrash, FaEdit } from 'react-icons/fa'
import Link from 'next/link'

export default function CustomersListPage() {
  const [customers, setCustomers] = useState([])
  const [editingPhone, setEditingPhone] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      // order by timestamp (newest first)
      const q = query(
        collection(db, 'customers'),
        orderBy('timestamp', 'desc')
      )
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCustomers(list)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (customer) => {
    setEditingPhone(customer.id)
    setEditForm({
      name: customer.name || '',
      address: customer.address || '',
      orderCount: customer.orderCount || '',
      customerId: customer.customerId || '',
      referralId: customer.referralId || '',
      mapLink: customer.mapLink || '',
    })
  }

  const cancelEdit = () => {
    setEditingPhone(null)
    setEditForm({})
  }

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const saveEdit = async (phone) => {
    try {
      const ref = doc(db, 'customers', phone)
      await updateDoc(ref, {
        ...editForm,
        updatedAt: new Date(), // keep track of edits too
      })
      setCustomers((prev) =>
        prev.map((c) => (c.id === phone ? { ...c, ...editForm } : c))
      )
      cancelEdit()
    } catch (error) {
      console.error('Failed to update customer:', error)
    }
  }

  const deleteCustomer = async (phone) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteDoc(doc(db, 'customers', phone))
        setCustomers((prev) => prev.filter((c) => c.id !== phone))
      } catch (error) {
        console.error('Failed to delete customer:', error)
      }
    }
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <nav className="mb-6 text-sm text-gray-400">
        <ol className="flex">
          <li>
            <Link href="/dashboard" className="text-blue-400 hover:text-blue-500 underline">Home</Link>
          </li>
          <li><span className="mx-2">›</span></li>
          <li className="text-gray-300">All Customers</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold mb-6">Customer List  
        <span className="text-lg font-normal text-gray-400 ml-2">
        ({customers.length})
      </span>
      </h1>

      {loading ? (
        <p>Loading customers...</p>
      ) : customers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <div className="space-y-4">
          {customers.map((customer) => (
            <div key={customer.id} className="border border-gray-700 p-4 rounded bg-gray-800 relative">
              {editingPhone === customer.id ? (
                <>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    placeholder="Customer Name"
                    className="w-full mb-2 px-3 py-2 rounded bg-gray-700 text-white"
                  />
                  <input
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    placeholder="Address"
                    className="w-full mb-2 px-3 py-2 rounded bg-gray-700 text-white"
                  />
                  <input
                    name="customerId"
                    value={editForm.customerId}
                    onChange={handleEditChange}
                    placeholder="Customer ID"
                    className="w-full mb-2 px-3 py-2 rounded bg-gray-700 text-white"
                  />
                  <input
                    name="orderCount"
                    value={editForm.orderCount}
                    onChange={handleEditChange}
                    placeholder="Order Count"
                    className="w-full mb-2 px-3 py-2 rounded bg-gray-700 text-white"
                  />
                  <input
                    name="referralId"
                    value={editForm.referralId}
                    onChange={handleEditChange}
                    placeholder="Referral ID"
                    className="w-full mb-2 px-3 py-2 rounded bg-gray-700 text-white"
                  />
                  <input
                    name="mapLink"
                    value={editForm.mapLink}
                    onChange={handleEditChange}
                    placeholder="Map Location"
                    className="w-full mb-2 px-3 py-2 rounded bg-gray-700 text-white"
                  />
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => saveEdit(customer.id)} className="bg-green-600 px-4 py-2 rounded">
                      Save
                    </button>
                    <button onClick={cancelEdit} className="bg-gray-600 px-4 py-2 rounded">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p><strong>Name:</strong> {customer.name}</p>
                  <p><strong>Address:</strong> {customer.address}</p>
                  <p><strong>Phone:</strong> {customer.phone}</p>
                  <p><strong>Customer ID:</strong> {customer.customerId}</p>
                  <p><strong>Orders:</strong> {customer.orderCount || 0}</p>
                  <p><strong>Referral ID:</strong> {customer.referralId || 0}</p>
                  {customer.createdAt && (
                    <p><strong>Created:</strong> {customer.createdAt.toDate().toLocaleString()}</p>
                  )}
                  {customer.mapLink && (
                    <p>
                      <strong>Map Link:</strong>{' '}
                      <a
                        href={customer.mapLink.startsWith('http') ? customer.mapLink : `https://${customer.mapLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        View Location
                      </a>
                    </p>
                  )}

                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => startEdit(customer)}
                      title="Edit"
                      className="bg-indigo-600 p-2 rounded"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteCustomer(customer.id)}
                      title="Delete"
                      className="bg-red-600 p-2 rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
