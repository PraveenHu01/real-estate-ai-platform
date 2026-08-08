import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, X, Users, Building, DollarSign, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [properties, setProperties] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProperties: 12,
    approvedProperties: 10,
    pendingProperties: 2,
    totalUsers: 142,
    platformRevenueLakhs: 18.5
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setProperties(res.data.properties || []);
      setMetrics(res.data.metrics || metrics);
    } catch (err) {
      // Fallback
      setProperties([
        {
          id: "prop-101",
          title: "Luxury 2BHK Apartment in MP Nagar",
          city: "Bhopal",
          price_lakhs: 58.5,
          seller: { name: "Rajesh Sharma" },
          status: "Approved"
        },
        {
          id: "prop-999",
          title: "Pending Commercial Plot 1000 Sqft",
          city: "Bhopal",
          price_lakhs: 25.0,
          seller: { name: "New Seller" },
          status: "Pending"
        }
      ]);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/admin/property/${id}/status`, { status });
      setProperties(prev => prev.map(p => (p.id === id || p._id === id ? { ...p, status } : p)));
    } catch (err) {
      setProperties(prev => prev.map(p => (p.id === id || p._id === id ? { ...p, status } : p)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Portal</span>
          </div>
          <h1 className="text-3xl font-black text-white">Admin Management Dashboard</h1>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Listings</span>
          <span className="text-2xl font-black text-white mt-1 block">{metrics.totalProperties}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Pending Approvals</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{metrics.pendingProperties}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Registered Users</span>
          <span className="text-2xl font-black text-blue-400 mt-1 block">{metrics.totalUsers}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Est. Platform Revenue</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">₹{metrics.platformRevenueLakhs} L</span>
        </div>
      </div>

      {/* Property Moderation Table */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white">Property Verification &amp; Moderation</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4">Title &amp; City</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {properties.map(p => (
                <tr key={p.id || p._id} className="hover:bg-slate-900/50">
                  <td className="py-3 px-4 font-bold text-white">
                    {p.title} <span className="text-slate-400 font-normal">({p.city})</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">₹{p.price_lakhs} Lakhs</td>
                  <td className="py-3 px-4 text-slate-300">{p.seller?.name || 'Seller'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {p.status !== 'Approved' && (
                      <button 
                        onClick={() => handleStatusChange(p.id || p._id, 'Approved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      onClick={() => handleStatusChange(p.id || p._id, 'Rejected')}
                      className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-300 font-bold text-xs"
                    >
                      Remove Fake
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
