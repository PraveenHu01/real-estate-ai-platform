import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { BarChart3, TrendingUp, MapPin, Users, Building } from 'lucide-react';
import api from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState({
    propertiesByCity: [
      { city: "Bhopal", count: 48, avgPrice: 62.5 },
      { city: "Indore", count: 65, avgPrice: 71.0 },
      { city: "Bengaluru", count: 120, avgPrice: 155.0 },
      { city: "Mumbai", count: 95, avgPrice: 320.0 },
      { city: "Delhi", count: 82, avgPrice: 185.0 }
    ],
    priceTrendsYearly: [
      { year: "2022", Bhopal: 48.0, Indore: 52.0, Bengaluru: 110.0 },
      { year: "2023", Bhopal: 52.5, Indore: 58.0, Bengaluru: 124.0 },
      { year: "2024", Bhopal: 56.0, Indore: 63.5, Bengaluru: 138.0 },
      { year: "2025", Bhopal: 60.2, Indore: 68.0, Bengaluru: 152.0 },
      { year: "2026", Bhopal: 64.5, Indore: 74.2, Bengaluru: 168.5 }
    ],
    userRegistrationsMonthly: [
      { month: "Jan", buyers: 42, sellers: 12 },
      { month: "Feb", buyers: 58, sellers: 16 },
      { month: "Mar", buyers: 75, sellers: 22 },
      { month: "Apr", buyers: 90, sellers: 28 },
      { month: "May", buyers: 115, sellers: 34 },
      { month: "Jun", buyers: 142, sellers: 38 }
    ],
    propertyCategories: [
      { name: "2 BHK Flats", value: 42 },
      { name: "3 BHK Flats", value: 33 },
      { name: "Luxury Villas", value: 15 },
      { name: "Commercial", value: 10 }
    ]
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      if (res.data) setData(res.data);
    } catch (err) {
      // Fallback
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Platform &amp; Market Analytics Dashboard</h1>
          <p className="text-xs text-slate-400">Real-time real estate market trends, city distribution, &amp; user statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Chart 1: Properties count by city */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Building className="w-4 h-4 text-blue-400" />
            <span>Listings Distribution by City</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.propertiesByCity}>
                <XAxis dataKey="city" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Price trends yearly */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Avg Property Price Trend (₹ Lakhs)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.priceTrendsYearly}>
                <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Line type="monotone" dataKey="Bhopal" stroke="#3b82f6" strokeWidth={3} />
                <Line type="monotone" dataKey="Indore" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="Bengaluru" stroke="#8b5cf6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: User Registrations */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>User Registration Growth</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.userRegistrationsMonthly}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Bar dataKey="buyers" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sellers" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Categories Pie */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white">Property Category Breakdown</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.propertyCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.propertyCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
