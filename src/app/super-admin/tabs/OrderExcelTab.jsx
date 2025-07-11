'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function OrderExcelTab({ refreshKey }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [refreshKey]);

  const exportToExcel = () => {
    const exportData = orders.map(o => ({
      'Order ID': o.orderId || 'N/A',
      Address: o.address || 'N/A',
      Amount: o.paidAmount ? `₹${o.paidAmount}` : '₹0',
      'Delivery Charges': o.deliveryCharges ? `₹${o.deliveryCharges}` : '₹0',
      'Total Discount': o.totalDiscount ? `₹${o.totalDiscount}` : '₹0',
      'Payment Method': o.payment || 'N/A',
      Status: o.status || 'N/A',
      'Bill URL': o.orderBillUrl || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
      now.getHours()
    )}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const fileName = `Orders_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Order Details</h2>
        <button
          onClick={exportToExcel}
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded shadow"
        >
          Export to Excel
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
                <th className="px-4 py-3 border border-gray-600">Delivery Charges</th>
                <th className="px-4 py-3 border border-gray-600">Total Discount</th>
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
                  <td className="px-4 py-2 border border-gray-600">
                    {order.deliveryCharges ? `₹${order.deliveryCharges}` : '₹0'}
                  </td>
                  <td className="px-4 py-2 border border-gray-600">
                    {order.totalDiscount ? `₹${order.totalDiscount}` : '₹0'}
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
