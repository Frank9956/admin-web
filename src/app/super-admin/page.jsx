'use client';

import React, { useState } from 'react';
import OrderAnalyticsTab from './tabs/OrderAnalyticsTab';
import OrderExcelTab from './tabs/OrderExcelTab';
import CustomerDetailsTab from './tabs/CustomerDetailsTab';

const tabs = ['Order Analytics', 'Order Excel Sheet', 'Customer Details'];

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@gmail.com' && password === 'admin@456') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid email or password');
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
        <form
          onSubmit={handleLogin}
          className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm text-gray-100"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
          {error && <p className="mb-4 text-red-500">{error}</p>}

          <label className="block mb-2 font-semibold" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mb-4 px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="Enter email"
          />

          <label className="block mb-2 font-semibold" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mb-6 px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="Enter password"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-2 rounded font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <button
          onClick={handleRefresh}
          className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded shadow"
        >
          Refresh
        </button>
      </div>

      <div className="flex space-x-4 border-b pb-2 mb-6">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 font-medium ${
              activeTab === idx ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <OrderAnalyticsTab refreshKey={refreshKey} />}
      {activeTab === 1 && <OrderExcelTab refreshKey={refreshKey} />}
      {activeTab === 2 && <CustomerDetailsTab refreshKey={refreshKey} />}
    </div>
  );
}
