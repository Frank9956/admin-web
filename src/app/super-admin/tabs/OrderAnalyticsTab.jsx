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
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    revenue: 0,
    last24hOrders: 0,
    last7dOrders: 0,
    last24hRevenue: 0,
    last7dRevenue: 0,
    cashCount: 0,
    upiCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const ordersCol = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersCol);
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const total = orders.length;
        const pending = orders.filter(o => o.status === 'pending').length;
        const delivered = orders.filter(o => o.status === 'delivered').length;
        const revenue = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);

        const last24hOrders = orders.filter(o => {
          if (!o.createdAt) return false;
          const createdAtDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return createdAtDate > dayAgo;
        }).length;

        const last7dOrders = orders.filter(o => {
          if (!o.createdAt) return false;
          const createdAtDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return createdAtDate > weekAgo;
        }).length;

        const last24hRevenue = orders.reduce((sum, o) => {
          if (!o.createdAt) return sum;
          const createdAtDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          if (createdAtDate > dayAgo) return sum + (o.paidAmount || 0);
          return sum;
        }, 0);

        const last7dRevenue = orders.reduce((sum, o) => {
          if (!o.createdAt) return sum;
          const createdAtDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          if (createdAtDate > weekAgo) return sum + (o.paidAmount || 0);
          return sum;
        }, 0);

        // Calculate payment method counts
        const cashCount = orders.filter(o => o.payment === 'cash').length;
        const upiCount = orders.filter(o => o.payment === 'upi').length;

        setStats({
          total,
          pending,
          delivered,
          revenue,
          last24hOrders,
          last7dOrders,
          last24hRevenue,
          last7dRevenue,
          cashCount,
          upiCount,
        });
      } catch (err) {
        console.error('Failed to fetch order stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const pieData = {
    labels: ['Cash', 'UPI'],
    datasets: [
      {
        label: 'Payment Methods',
        data: [stats.cashCount, stats.upiCount],
        backgroundColor: ['#10B981', '#3B82F6'], // green and blue
        hoverBackgroundColor: ['#059669', '#2563EB'],
      },
    ],
  };

  return (
    <div className="space-y-10 bg-gray-900 p-6 rounded-lg">
      {/* Order Details Section */}
      <section>
        <h2 className="text-blue-400 text-xl font-semibold mb-4">Order Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading ? (
            <p className="text-gray-400 col-span-full text-center"></p>
          ) : (
            <>
              <Card
                title="Total Orders"
                value={stats.total}
                className="bg-blue-700 hover:bg-blue-600 transition"
              />
              <Card
                title="Pending"
                value={stats.pending}
                className="bg-blue-600 hover:bg-blue-500 transition"
              />
              <Card
                title="Delivered"
                value={stats.delivered}
                className="bg-blue-500 hover:bg-blue-400 transition"
              />
            </>
          )}
        </div>
      </section>

      {/* Revenue Section */}
      <section>
        <h2 className="text-green-400 text-xl font-semibold mb-4">Revenue</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading ? (
            <p className="text-gray-400 col-span-full text-center"></p>
          ) : (
            <>
              <Card
                title="Total Revenue"
                value={`₹${stats.revenue.toLocaleString()}`}
                className="bg-green-700 hover:bg-green-600 transition"
              />
              <Card
                title="Revenue Last 24h"
                value={`₹${stats.last24hRevenue.toLocaleString()}`}
                className="bg-green-600 hover:bg-green-500 transition"
              />
              <Card
                title="Revenue Last 7 Days"
                value={`₹${stats.last7dRevenue.toLocaleString()}`}
                className="bg-green-500 hover:bg-green-400 transition"
              />
            </>
          )}
        </div>
      </section>

      {/* Number of Orders Section */}
      <section>
        <h2 className="text-purple-400 text-xl font-semibold mb-4">Number of Orders</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading ? (
            <p className="text-gray-400 col-span-full text-center"></p>
          ) : (
            <>
              <Card
                title="Orders Last 24h"
                value={stats.last24hOrders}
                className="bg-purple-700 hover:bg-purple-600 transition"
              />
              <Card
                title="Orders Last 7 Days"
                value={stats.last7dOrders}
                className="bg-purple-600 hover:bg-purple-500 transition"
              />
            </>
          )}
        </div>
      </section>

      {/* Payment Method Pie Chart */}
      <section>
        <h2 className="text-yellow-400 text-xl font-semibold mb-4">Payment Method Distribution</h2>
        {loading ? (
          <p className="text-gray-400 text-center"></p>
        ) : (
          <div className="max-w-sm mx-auto bg-gray-800 rounded-xl p-4 shadow">
            <Pie data={pieData} />
          </div>
        )}
      </section>
    </div>
  );
}
