import React, { useEffect, useState } from 'react';
import PropertyComparator from '../components/PropertyComparator';
import { ArrowLeftRight } from 'lucide-react';
import api from '../services/api';

export default function ComparePage() {
  const [properties, setProperties] = useState([]);
  const [propAId, setPropAId] = useState('');
  const [propBId, setPropBId] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      const list = res.data.properties || [];
      setProperties(list);
      if (list.length >= 2) {
        setPropAId(list[0].id || list[0]._id);
        setPropBId(list[1].id || list[1]._id);
      }
    } catch (err) {
      // Fallback
    }
  };

  const propA = properties.find(p => (p.id || p._id) === propAId) || properties[0];
  const propB = properties.find(p => (p.id || p._id) === propBId) || properties[1];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Side-By-Side Comparison Matrix</span>
        </div>
        <h1 className="text-3xl font-black text-white">Compare Properties Side-by-Side</h1>
        <p className="text-xs text-slate-400">Select two properties to evaluate price per sq.ft, projected 5-year ROI, crime index, and estimated monthly EMI.</p>
      </div>

      {/* Selectors Header */}
      <div className="glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div>
          <label className="block text-slate-400 font-bold mb-2">Select Property A</label>
          <select 
            value={propAId} onChange={(e) => setPropAId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none"
          >
            {properties.map(p => (
              <option key={p.id || p._id} value={p.id || p._id}>{p.title} ({p.city}) - ₹{p.price_lakhs}L</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-bold mb-2">Select Property B</label>
          <select 
            value={propBId} onChange={(e) => setPropBId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none"
          >
            {properties.map(p => (
              <option key={p.id || p._id} value={p.id || p._id}>{p.title} ({p.city}) - ₹{p.price_lakhs}L</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparator Component */}
      <PropertyComparator propA={propA} propB={propB} />

    </div>
  );
}
