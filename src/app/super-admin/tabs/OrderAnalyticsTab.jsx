'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function Card({ title, value, className }) {
  return (
    <div className={`rounded-xl shadow p-6 ${className}`}>
      <p className="text-sm text-gray-300">{title}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function OrderAnalyticsTab() {
  const [stats, setStats] = useState({});
  const [customStats, setCustomStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString()}`;

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const ordersCol = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersCol);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setOrders(ordersData);

        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const getDate = (o) => o.createdAt?.toDate?.() || new Date(o.createdAt);

        const reduceSum = (arr, field, filter) =>
          arr.reduce((sum, o) => filter(o) ? sum + (parseFloat(o[field]) || 0) : sum, 0);

        const countOrders = (arr, filter) => arr.filter(filter).length;

        setStats({
          total: ordersData.length,
          pending: countOrders(ordersData, o => o.status === 'pending'),
          delivered: countOrders(ordersData, o => o.status === 'delivered'),
          revenue: reduceSum(ordersData, 'paidAmount', () => true),
          last24hRevenue: reduceSum(ordersData, 'paidAmount', o => getDate(o) > dayAgo),
          last7dRevenue: reduceSum(ordersData, 'paidAmount', o => getDate(o) > weekAgo),
          last30dRevenue: reduceSum(ordersData, 'paidAmount', o => getDate(o) > monthAgo),
          last24hOrders: countOrders(ordersData, o => getDate(o) > dayAgo),
          last7dOrders: countOrders(ordersData, o => getDate(o) > weekAgo),
          last30dOrders: countOrders(ordersData, o => getDate(o) > monthAgo),
          totalDiscount: reduceSum(ordersData, 'totalDiscount', () => true),
          last24hDiscount: reduceSum(ordersData, 'totalDiscount', o => getDate(o) > dayAgo),
          last7dDiscount: reduceSum(ordersData, 'totalDiscount', o => getDate(o) > weekAgo),
          last30dDiscount: reduceSum(ordersData, 'totalDiscount', o => getDate(o) > monthAgo),
          deliveryCharges: reduceSum(ordersData, 'deliveryCharges', () => true),
          last24hDeliveryCharges: reduceSum(ordersData, 'deliveryCharges', o => getDate(o) > dayAgo),
          last7dDeliveryCharges: reduceSum(ordersData, 'deliveryCharges', o => getDate(o) > weekAgo),
          last30dDeliveryCharges: reduceSum(ordersData, 'deliveryCharges', o => getDate(o) > monthAgo),
          cashCount: countOrders(ordersData, o => o.payment === 'cash'),
          upiCount: countOrders(ordersData, o => o.payment === 'upi'),
        });

      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const handleCustomFilter = () => {
    if (!customStart || !customEnd) return;

    const start = new Date(customStart);
    const end = new Date(customEnd);

    const inRange = (o) => {
      const d = o.createdAt?.toDate?.() || new Date(o.createdAt);
      return d >= start && d <= end;
    };

    const filtered = orders.filter(inRange);

    const reduceSum = (arr, field) =>
      arr.reduce((sum, o) => sum + (parseFloat(o[field]) || 0), 0);

    setCustomStats({
      orders: filtered.length,
      revenue: reduceSum(filtered, 'paidAmount'),
      discount: reduceSum(filtered, 'totalDiscount'),
      deliveryCharges: reduceSum(filtered, 'deliveryCharges')
    });
  };

  const pieData = {
    labels: ['Cash', 'UPI'],
    datasets: [
      {
        label: 'Payment Methods',
        data: [stats.cashCount || 0, stats.upiCount || 0],
        backgroundColor: ['#10B981', '#3B82F6'],
        hoverBackgroundColor: ['#059669', '#2563EB'],
      },
    ],
  };

  return (
    <div className="space-y-10 bg-gray-900 p-6 rounded-lg">
      {/* Custom Filter Section */}
      <section>
        <h2 className="text-orange-300 text-xl font-semibold mb-4">Filter by Date Range</h2>
        <div className="flex flex-wrap items-end gap-4">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
          />
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
          />
          <button
            onClick={handleCustomFilter}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium"
          >
            Apply Filter
          </button>
        </div>

        {/* Display Filtered Stats */}
        {customStats.orders > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card title="Filtered Orders" value={customStats.orders} className="bg-gray-700" />
            <Card title="Filtered Revenue" value={formatCurrency(customStats.revenue)} className="bg-green-700" />
            <Card title="Filtered Discount" value={formatCurrency(customStats.discount)} className="bg-pink-700" />
            <Card title="Filtered Delivery Charges" value={formatCurrency(customStats.deliveryCharges)} className="bg-orange-700" />
          </div>
        )}
      </section>

      {/* Standard Analytics Sections */}
      <section>
        <h2 className="text-blue-400 text-xl font-semibold mb-4">Order Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card title="Total Orders" value={stats.total} className="bg-blue-700" />
          <Card title="Pending" value={stats.pending} className="bg-blue-600" />
          <Card title="Delivered" value={stats.delivered} className="bg-blue-500" />
        </div>
      </section>

      <section>
        <h2 className="text-green-400 text-xl font-semibold mb-4">Revenue</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card title="Total Revenue" value={formatCurrency(stats.revenue)} className="bg-green-700" />
          <Card title="Last 24h" value={formatCurrency(stats.last24hRevenue)} className="bg-green-600" />
          <Card title="Last 7 Days" value={formatCurrency(stats.last7dRevenue)} className="bg-green-500" />
          <Card title="Last 30 Days" value={formatCurrency(stats.last30dRevenue)} className="bg-green-400" />
        </div>
      </section>

      <section>
        <h2 className="text-purple-400 text-xl font-semibold mb-4">Number of Orders</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card title="Last 24h" value={stats.last24hOrders} className="bg-purple-700" />
          <Card title="Last 7 Days" value={stats.last7dOrders} className="bg-purple-600" />
          <Card title="Last 30 Days" value={stats.last30dOrders} className="bg-purple-500" />
        </div>
      </section>

      <section>
        <h2 className="text-pink-400 text-xl font-semibold mb-4">Discount Offered</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card title="Total Discount" value={formatCurrency(stats.totalDiscount)} className="bg-pink-700" />
          <Card title="Last 24h" value={formatCurrency(stats.last24hDiscount)} className="bg-pink-600" />
          <Card title="Last 7 Days" value={formatCurrency(stats.last7dDiscount)} className="bg-pink-500" />
          <Card title="Last 30 Days" value={formatCurrency(stats.last30dDiscount)} className="bg-pink-400" />
        </div>
      </section>

      <section>
        <h2 className="text-orange-400 text-xl font-semibold mb-4">Delivery Charges</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card title="Total Charges" value={formatCurrency(stats.deliveryCharges)} className="bg-orange-700" />
          <Card title="Last 24h" value={formatCurrency(stats.last24hDeliveryCharges)} className="bg-orange-600" />
          <Card title="Last 7 Days" value={formatCurrency(stats.last7dDeliveryCharges)} className="bg-orange-500" />
          <Card title="Last 30 Days" value={formatCurrency(stats.last30dDeliveryCharges)} className="bg-orange-400" />
        </div>
      </section>

      <section>
        <h2 className="text-yellow-400 text-xl font-semibold mb-4">Payment Method Distribution</h2>
        <div className="max-w-sm mx-auto bg-gray-800 rounded-xl p-4 shadow">
          <Pie data={pieData} />
        </div>
      </section>
    </div>
  );
}
