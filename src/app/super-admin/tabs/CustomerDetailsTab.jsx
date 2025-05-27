'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function CustomerDetailsTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      try {
        const ordersCol = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersCol);

        // Aggregate by customerName & store phone
        const customerMap = {};

        ordersSnapshot.forEach(doc => {
          const data = doc.data();
          const name = data.customerName || 'Unknown';
          const phone = data.phone || 'N/A'; // adapt field name
          const amount = parseFloat(data.paidAmount) || 0;

          if (!customerMap[name]) {
            customerMap[name] = { orders: 0, spent: 0, phone };
          }
          customerMap[name].orders += 1;
          customerMap[name].spent += amount;
        });

        const customerArray = Object.entries(customerMap).map(([name, stats]) => ({
          name,
          phone: stats.phone,
          orders: stats.orders,
          spent: `₹${stats.spent.toFixed(2)}`,
        }));

        setCustomers(customerArray);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  return (
    <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Customer Details</h2>

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
                <th className="px-4 py-3 border border-gray-600 text-right">No. of Orders</th>
                <th className="px-4 py-3 border border-gray-600 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((user, idx) => (
                <tr key={idx} className="even:bg-gray-700">
                  <td className="px-4 py-2 border border-gray-600">{user.name}</td>
                  <td className="px-4 py-2 border border-gray-600">{user.phone}</td>
                  <td className="px-4 py-2 border border-gray-600 text-right">{user.orders}</td>
                  <td className="px-4 py-2 border border-gray-600 text-right">{user.spent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
