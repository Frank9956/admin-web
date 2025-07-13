'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function CustomerDetailsTab({ refreshKey }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normalize phone numbers to last 10 digits
  const normalizePhone = phone => phone?.toString().replace(/\D/g, '').slice(-10);

  useEffect(() => {
    fetchCustomerStats();
  }, [refreshKey]);

  async function fetchCustomerStats() {
    setLoading(true);
    try {
      const customersSnap = await getDocs(collection(db, 'customers'));
      const ordersSnap = await getDocs(collection(db, 'orders'));

      const orderDataByPhone = {};

      ordersSnap.forEach(doc => {
        const order = doc.data();
        const paid = parseFloat(order.paidAmount) || 0;
        const orderPhone = normalizePhone(order.phone);
        
        
        if (orderPhone) {
          if (!orderDataByPhone[orderPhone]) {
            orderDataByPhone[orderPhone] = { total: 0, count: 0 };
          }
          orderDataByPhone[orderPhone].total += paid;
          orderDataByPhone[orderPhone].count += 1;
        }
      });
      
      const customerList = customersSnap.docs.map(doc => {
        const data = doc.data();
        const phone = normalizePhone(data.phone) || 'N/A';
        const name = data.name || 'Unknown';
        const referralId = data.referralId || '—';
        const customerId = data.customerId || '—';
        const stats = orderDataByPhone[phone] || { total: 0, count: 0 };
        const mapLink = data.mapLink || '';
        
        return {
          name,
          phone,
          referralId,
          customerId,
          orders: stats.count,
          total: stats.total,
          mapLink,
        };
      });

      setCustomers(customerList);
    } catch (err) {
      console.error('Error fetching customer stats:', err);
    } finally {
      setLoading(false);
    }
  }

  const exportToExcel = () => {
    const exportData = customers.map((c, i) => ({
      Name: c.name,
      'Customer ID': c.customerId,
      'Phone Number': c.phone,
      'Referral ID': c.referralId,
      'No. of Orders': c.orders,
      'Total Spent': `₹${c.total.toFixed(2)}`,
      'Map Location': c.mapLink ? 'Map Location' : 'N/A', // display text
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Add hyperlinks manually
    customers.forEach((c, idx) => {
      if (c.mapLink) {
        const cellAddress = `G${idx + 2}`; // G column, +2 because of header row
        worksheet[cellAddress].l = {
          Target: c.mapLink.startsWith('http') ? c.mapLink : `https://${c.mapLink}`,
          Tooltip: 'Open Map Location',
        };
      }
    });
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
      now.getHours()
    )}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const fileName = `Customers_${timestamp}.xlsx`;
  
    XLSX.writeFile(workbook, fileName);
  };
  

  return (
    <div className="p-8 mx-auto font-sans bg-gray-900 min-h-screen text-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-400">Customer Details</h2>
        <button
          onClick={exportToExcel}
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded shadow"
        >
          Export to Excel
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
                <th className="px-4 py-3 border border-gray-600">Customer ID</th>
                <th className="px-4 py-3 border border-gray-600">Phone Number</th>
                <th className="px-4 py-3 border border-gray-600">Referral ID</th>
                <th className="px-4 py-3 border border-gray-600 text-right">No. of Orders</th>
                <th className="px-4 py-3 border border-gray-600 text-right">Total Spent</th>
                <th className="px-4 py-3 border border-gray-600">Map Location</th>

              </tr>
            </thead>
            <tbody>
              {customers.map((user, idx) => (
                <tr key={idx} className="even:bg-gray-700">
                  <td className="px-4 py-2 border border-gray-600">{user.name}</td>
                  <td className="px-4 py-2 border border-gray-600">{user.customerId}</td>
                  <td className="px-4 py-2 border border-gray-600">{user.phone}</td>
                  <td className="px-4 py-2 border border-gray-600">{user.referralId}</td>
                  <td className="px-4 py-2 border border-gray-600 text-right">{user.orders}</td>
                  <td className="px-4 py-2 border border-gray-600 text-right">
                    ₹{user.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 border border-gray-600">
                    {user.mapLink ? (
                      <a
                        href={user.mapLink.startsWith('http') ? user.mapLink : `https://${user.mapLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        Map Location
                      </a>
                    ) : (
                      'N/A'
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
