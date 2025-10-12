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
  // Prepare mapped export data
  const exportData = orders.map((o) => {
    const paid = Number(o.paidAmount) || 0;
    const purchase = Number(o.purchaseAmount) || 0;
    const delivery = Number(o.deliveryCharges) || 0;

    const profitLoss = paid - (purchase + delivery);
    const burnAmount = profitLoss < 0 ? Math.abs(profitLoss) : 0;

    return {
      'Created At': o.createdAt?.toDate
        ? o.createdAt.toDate().toLocaleString()
        : 'N/A',
      'Order ID': o.orderId || 'N/A',
      'Paid Amount': paid,
      'Delivery Charges': delivery,
      'Total Purchase': purchase,
      'P&L': profitLoss,
      'Burn Amount': burnAmount,
      'Payment Method': o.payment || 'N/A',
    };
  });

  // --- Calculate Totals ---
  const totals = {
    'Created At': '',
    'Order ID': 'TOTAL →',
    'Paid Amount': exportData.reduce((sum, o) => sum + (o['Paid Amount'] || 0), 0),
    'Delivery Charges': exportData.reduce((sum, o) => sum + (o['Delivery Charges'] || 0), 0),
    'Total Purchase': exportData.reduce((sum, o) => sum + (o['Total Purchase'] || 0), 0),
    'P&L': exportData.reduce((sum, o) => sum + (o['P&L'] || 0), 0),
    'Burn Amount': exportData.reduce((sum, o) => sum + (o['Burn Amount'] || 0), 0),
    'Payment Method': '',
  };

  // --- Add totals row on top ---
  const finalData = [totals, ...exportData];

  // --- Create worksheet ---
  const worksheet = XLSX.utils.json_to_sheet(finalData);

  // --- Auto column widths ---
  worksheet["!cols"] = Object.keys(finalData[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...finalData.map((row) => String(row[key] || "").length)
    ),
  }));

  // --- Create workbook ---
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  // --- Timestamped file name ---
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
    now.getHours()
  )}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const fileName = `Orders_${timestamp}.xlsx`;

  // --- Write file ---
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
          <table className="w-full text-sm text-left border-collapse border border-gray-700 min-w-max">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-3 border border-gray-600">Created At</th>
                <th className="px-4 py-3 border border-gray-600">Order ID</th>
                <th className="px-4 py-3 border border-gray-600">Address</th>
                <th className="px-4 py-3 border border-gray-600">Paid Amount</th>
                <th className="px-4 py-3 border border-gray-600">Delivery Charges</th>
                <th className="px-4 py-3 border border-gray-600">Total Purchase</th>
                <th className="px-4 py-3 border border-gray-600">P&amp;L</th>
                <th className="px-4 py-3 border border-gray-600">Payment Method</th>
                <th className="px-4 py-3 border border-gray-600">Bill PDF</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const paid = Number(order.paidAmount) || 0;
                const purchase = Number(order.purchaseAmount) || 0;
                const delivery = Number(order.deliveryCharges) || 0;

                const profitLoss = paid - (purchase + delivery);

                return (
                  <tr
                    key={order.id}
                    className={`even:bg-gray-700 hover:bg-gray-600 transition-colors ${profitLoss < 0
                        ? 'text-red-400'
                        : profitLoss > 0
                          ? 'text-green-400'
                          : 'text-gray-300'
                      }`}
                  >
                    <td className="px-4 py-2 border border-gray-600">
                      {order.createdAt?.toDate
                        ? new Date(order.createdAt.toDate()).toLocaleString()
                        : 'N/A'}
                    </td>

                    <td className="px-4 py-2 border border-gray-600">{order.orderId || 'N/A'}</td>
                    <td className="px-4 py-2 border border-gray-600 break-words max-w-xs">
                      {order.address || 'N/A'}
                    </td>

                    <td className="px-4 py-2 border border-gray-600">₹{paid}</td>
                    <td className="px-4 py-2 border border-gray-600">₹{delivery}</td>
                    <td className="px-4 py-2 border border-gray-600">₹{purchase}</td>

                    <td className="px-4 py-2 border border-gray-600">
                      ₹{profitLoss}
                    </td>


                    <td className="px-4 py-2 border border-gray-600">{order.payment || 'N/A'}</td>

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
                );
              })}
            </tbody>
          </table>
        </div>

      )}
    </div>
  );
}
