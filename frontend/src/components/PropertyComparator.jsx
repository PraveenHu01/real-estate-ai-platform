import React from 'react';
import { ArrowLeftRight, Check, X, TrendingUp, ShieldCheck, Bed, Bath, Maximize2 } from 'lucide-react';

export default function PropertyComparator({ propA, propB }) {
  if (!propA || !propB) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        Select two properties from the properties page to compare side-by-side.
      </div>
    );
  }

  const calcEmi = (priceLakhs) => Math.round(((priceLakhs * 0.8 * 100000) * (0.085/12) * Math.pow(1 + 0.085/12, 240)) / (Math.pow(1 + 0.085/12, 240) - 1));

  const compareRows = [
    { label: 'Property Title', valA: propA.title, valB: propB.title, isHeader: true },
    { label: 'City & Location', valA: `${propA.location}, ${propA.city}`, valB: `${propB.location}, ${propB.city}` },
    { label: 'Price (Lakhs)', valA: `₹${propA.price_lakhs} Lakhs`, valB: `₹${propB.price_lakhs} Lakhs`, highlight: propA.price_lakhs < propB.price_lakhs ? 'A' : 'B' },
    { label: 'Built-up Area', valA: `${propA.area_sqft} sq.ft`, valB: `${propB.area_sqft} sq.ft`, highlight: propA.area_sqft > propB.area_sqft ? 'A' : 'B' },
    { label: 'Price per sq.ft', valA: `₹${Math.round((propA.price_lakhs * 100000) / propA.area_sqft)}`, valB: `₹${Math.round((propB.price_lakhs * 100000) / propB.area_sqft)}` },
    { label: 'Bedrooms / Baths', valA: `${propA.bedrooms} BHK / ${propA.bathrooms} Baths`, valB: `${propB.bedrooms} BHK / ${propB.bathrooms} Baths` },
    { label: 'Est. Monthly EMI', valA: `₹${calcEmi(propA.price_lakhs).toLocaleString('en-IN')}`, valB: `₹${calcEmi(propB.price_lakhs).toLocaleString('en-IN')}` },
    { label: 'Projected 5Y ROI', valA: `+${propA.roi_5y_pct || 44.4}%`, valB: `+${propB.roi_5y_pct || 52.3}%`, highlight: (propA.roi_5y_pct || 44.4) > (propB.roi_5y_pct || 52.3) ? 'A' : 'B' },
    { label: 'AI Investment Score', valA: `${propA.ai_rating || 9.3} / 10`, valB: `${propB.ai_rating || 9.6} / 10`, highlight: (propA.ai_rating || 9.3) > (propB.ai_rating || 9.6) ? 'A' : 'B' },
    { label: 'Crime Safety Score', valA: `${propA.crime_score || 2.2} (Safe)`, valB: `${propB.crime_score || 2.1} (Very Safe)` },
    { label: 'School Distance', valA: `${propA.nearby_facilities?.school_dist_m || 450} meters`, valB: `${propB.nearby_facilities?.school_dist_m || 500} meters` },
    { label: 'Metro Proximity', valA: `${propA.nearby_facilities?.metro_dist_m || 1200} meters`, valB: `${propB.nearby_facilities?.metro_dist_m || 400} meters`, highlight: (propA.nearby_facilities?.metro_dist_m || 1200) < (propB.nearby_facilities?.metro_dist_m || 400) ? 'A' : 'B' },
    { label: 'Furnished Status', valA: propA.furnished, valB: propB.furnished }
  ];

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 overflow-hidden">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Side-by-Side Property Comparison</h3>
          <p className="text-xs text-slate-400">Compare price, ROI, EMI, safety, and nearby amenities</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-3 px-4 w-1/3">Feature Specification</th>
              <th className="py-3 px-4 w-1/3 text-blue-400 font-bold">{propA.title}</th>
              <th className="py-3 px-4 w-1/3 text-purple-400 font-bold">{propB.title}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {compareRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-900/50 transition">
                <td className="py-3 px-4 font-semibold text-slate-300">{row.label}</td>
                <td className={`py-3 px-4 ${row.highlight === 'A' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-200'}`}>
                  {row.valA}
                </td>
                <td className={`py-3 px-4 ${row.highlight === 'B' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-200'}`}>
                  {row.valB}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
