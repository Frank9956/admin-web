'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function CustomerDetailsTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCustomerStats();
  }, []);

  async function fetchCustomerStats() {
    setLoading(true);
    try {
      const customersSnap = await getDocs(collection(db, 'customers'));
      const ordersSnap = await getDocs(collection(db, 'orders'));

      const orderDataByPhone = {};

      ordersSnap.forEach(doc => {
        const order = doc.data();
        const phone = order.phone;
        const paid = parseFloat(order.paidAmount) || 0;

        if (phone) {
          if (!orderDataByPhone[phone]) {
            orderDataByPhone[phone] = { total: 0, count: 0 };
          }
          orderDataByPhone[phone].total += paid;
          orderDataByPhone[phone].count += 1;
        }
      });

      const customerList = customersSnap.docs.map(doc => {
        const data = doc.data();
        const phone = data.phone || 'N/A';
        const name = data.name || 'Unknown';
        const referralId = data.referralId || '—';
        const stats = orderDataByPhone[phone] || { total: 0, count: 0 };

        return {
          name,
          phone,
          referralId,
          orders: stats.count,
          total: `₹${stats.total.toFixed(2)}`,
        };
      });

      setCustomers(customerList);
    } catch (err) {
      console.error('Error fetching customer stats:', err);
    } finally {
      setLoading(false);
    }
  }

  const updateGoogleSheet = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/export/customers');
      if (!res.ok) throw new Error('Failed to update Google Sheet');
      alert('✅ Google Sheet updated successfully!');
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
        <h2 className="text-2xl font-bold text-blue-400">Customer Details</h2>
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
        <p className="text-gray-400">Loading customer data...</p>
      ) : customers.length === 0 ? (
        <p className="text-gray-400">No customer data found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800 shadow">
          <table className="w-full text-sm text-left border-collapse border border-gray-700">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-3 border border-gray-600">Name</th>
                <th className="px-4 py-3 border border-gray-600">Phone Number</th>
                <th className="px-4 py-3 border border-gray-600">Referral ID</th>
                <th className="px-4 py-3 border border-gray-600 text-right">No. of Orders</th>
                <th className="px-4 py-3 border border-gray-600 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((user, idx) => (
                <tr key={idx} className="even:bg-gray-700">
                  <td className="px-4 py-2 border border-gray-600">{user.name}</td>
                  <td className="px-4 py-2 border border-gray-600">{user.phone}</td>
                  <td className="px-4 py-2 border border-gray-600">{user.referralId}</td>
                  <td className="px-4 py-2 border border-gray-600 text-right">{user.orders}</td>
                  <td className="px-4 py-2 border border-gray-600 text-right">{user.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
