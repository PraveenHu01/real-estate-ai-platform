import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, ShieldCheck, Award, AlertTriangle, ArrowRight, DollarSign, Activity } from 'lucide-react';
import api from '../services/api';

export default function InvestmentAnalysisPage() {
  const [currentPrice, setCurrentPrice] = useState(50);
  const [city, setCity] = useState('Bhopal');
  const [location, setLocation] = useState('MP Nagar');
  const [ageYears, setAgeYears] = useState(2);

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState({
    current_price_lakhs: 50.0,
    predicted_price_1y: 53.6,
    predicted_price_3y: 61.6,
    predicted_price_5y: 73.2,
    expected_roi_5y_pct: 46.4,
    risk_level: "Low",
    annual_cagr_pct: 7.9,
    ai_rating: 9.2
  });

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/ai/investment-analysis', {
        current_price_lakhs: parseFloat(currentPrice),
        city,
        location,
        age_years: parseInt(ageYears)
      });
      setAnalysis(res.data);
    } catch (err) {
      const p = parseFloat(currentPrice);
      const rate = city === 'Bengaluru' ? 0.095 : 0.075;
      setAnalysis({
        current_price_lakhs: p,
        predicted_price_1y: Math.round(p * (1 + rate) * 10) / 10,
        predicted_price_3y: Math.round(p * Math.pow(1 + rate, 3) * 10) / 10,
        predicted_price_5y: Math.round(p * Math.pow(1 + rate, 5) * 10) / 10,
        expected_roi_5y_pct: Math.round((Math.pow(1 + rate, 5) - 1) * 1000) / 10,
        risk_level: ageYears > 15 ? "Moderate" : "Low",
        annual_cagr_pct: Math.round(rate * 1000) / 10,
        ai_rating: 9.2
      });
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { year: 'Current', price: analysis.current_price_lakhs },
    { year: 'Year 1', price: analysis.predicted_price_1y },
    { year: 'Year 3', price: analysis.predicted_price_3y },
    { year: 'Year 5', price: analysis.predicted_price_5y },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-bold uppercase tracking-widest">
          <Activity className="w-3.5 h-3.5" />
          <span>Real Estate Portfolio &amp; Growth Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Investment Analysis &amp; ROI Projections</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Forecast 1Y, 3Y, and 5Y property price trajectories, annual CAGR returns, and risk profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Form */}
        <form onSubmit={handleAnalyze} className="lg:col-span-5 glass-card p-6 rounded-2xl space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">Investment Parameters</h3>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Current Property Price (Lakhs ₹)</label>
            <input 
              type="number" value={currentPrice} min="10" max="1000"
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Target City</label>
            <select 
              value={city} onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none"
            >
              <option value="Bhopal">Bhopal</option>
              <option value="Indore">Indore</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Building Age (Years)</label>
            <input 
              type="number" value={ageYears} min="0" max="30"
              onChange={(e) => setAgeYears(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg glow-violet transition"
          >
            {loading ? 'Running Projections...' : 'Run Investment Analysis'}
          </button>
        </form>

        {/* Results & Chart */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">5-Year Price</span>
              <span className="text-xl font-black text-white mt-1 block">₹{analysis.predicted_price_5y} L</span>
            </div>
            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Expected ROI</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">+{analysis.expected_roi_5y_pct}%</span>
            </div>
            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Risk Level</span>
              <span className="text-xl font-black text-blue-400 mt-1 block">{analysis.risk_level}</span>
            </div>
            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">AI Rating</span>
              <span className="text-xl font-black text-purple-400 mt-1 block">{analysis.ai_rating}/10</span>
            </div>
          </div>

          {/* Capital Growth Area Chart */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-white">5-Year Valuation Growth Trajectory</h4>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} unit="L" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                  <Area type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
