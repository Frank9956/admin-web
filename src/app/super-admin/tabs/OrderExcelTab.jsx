'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function OrderExcelTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const ordersCol = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersCol);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const updateGoogleSheet = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/export/orders');
      if (!res.ok) throw new Error('Failed to update sheet');
      alert('✅ Google Sheet updated successfully.');
    } catch (err) {
      console.error('Update error:', err);
      alert('❌ Failed to update Google Sheet.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Order Details</h2>
        <button
          onClick={updateGoogleSheet}
          disabled={updating}
          className={`${
            updating ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'
          } transition text-white px-5 py-2 rounded shadow`}
        >
          {updating ? 'Updating...' : 'Update Google Sheet'}
        </button>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800 shadow">
          <table className="w-full text-sm text-left border-collapse border border-gray-700">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-3 border border-gray-600">Order ID</th>
                <th className="px-4 py-3 border border-gray-600">Address</th>
                <th className="px-4 py-3 border border-gray-600">Amount</th>
                <th className="px-4 py-3 border border-gray-600">Payment Method</th>
                <th className="px-4 py-3 border border-gray-600">Status</th>
                <th className="px-4 py-3 border border-gray-600">Bill PDF</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="even:bg-gray-700">
                  <td className="px-4 py-2 border border-gray-600">{order.orderId || 'N/A'}</td>
                  <td className="px-4 py-2 border border-gray-600">{order.address || 'N/A'}</td>
                  <td className="px-4 py-2 border border-gray-600">
                    {order.paidAmount ? `₹${order.paidAmount}` : '₹0'}
                  </td>
                  <td className="px-4 py-2 border border-gray-600">{order.payment || 'N/A'}</td>
                  <td className="px-4 py-2 border border-gray-600 capitalize">{order.status || 'N/A'}</td>
                  <td className="px-4 py-2 border border-gray-600 text-center">
                    {order.orderBillUrl ? (
                      <a
                        href={order.orderBillUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-600 underline"
                      >
                        View PDF
                      </a>
                    ) : (
                      <span className="text-gray-500 italic">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
