import React, { useState } from 'react';
import PropertyCard from '../components/PropertyCard';
import { Sparkles, Compass, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function AIRecommendationsPage() {
  const [budget, setBudget] = useState(60);
  const [preferredCity, setPreferredCity] = useState('Bhopal');
  const [bedrooms, setBedrooms] = useState(2);
  const [officeLocality, setOfficeLocality] = useState('MP Nagar');

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([
    {
      id: "prop-101",
      title: "Luxury 2BHK Apartment in MP Nagar",
      description: "Spacious 2BHK ready-to-move apartment located in the prime commercial hub of Bhopal.",
      city: "Bhopal",
      location: "MP Nagar",
      price_lakhs: 58.5,
      area_sqft: 1150,
      bedrooms: 2,
      bathrooms: 2,
      furnished: "Fully-Furnished",
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"],
      roi_5y_pct: 44.4,
      ai_rating: 9.3,
      isFeatured: true
    },
    {
      id: "prop-102",
      title: "Premium 3BHK Greens Villa",
      description: "Exclusive 3BHK independent villa in green Arera Colony.",
      city: "Bhopal",
      location: "Arera Colony",
      price_lakhs: 92.0,
      area_sqft: 1850,
      bedrooms: 3,
      bathrooms: 3,
      furnished: "Semi-Furnished",
      images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"],
      roi_5y_pct: 47.8,
      ai_rating: 9.5,
      isFeatured: true
    }
  ]);

  const handleRecommend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/ai/recommend', {
        budget_lakhs: parseFloat(budget),
        preferred_city: preferredCity,
        bedrooms: parseInt(bedrooms),
        preferred_locality: officeLocality
      });
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      // Keep state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Personalized Match Matrix</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">AI Property Recommendation Engine</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Instead of showing random properties, our AI algorithm ranks listings using your budget, office distance, and lifestyle preferences.
        </p>
      </div>

      {/* Input Preferences Bar */}
      <form onSubmit={handleRecommend} className="glass-card p-6 rounded-2xl space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Specify Your Lifestyle Criteria</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
          <div>
            <label className="block text-slate-400 mb-1">Max Budget (₹ Lakhs)</label>
            <input 
              type="number" value={budget} min="20" max="500"
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Target City</label>
            <select 
              value={preferredCity} onChange={(e) => setPreferredCity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
            >
              <option value="Bhopal">Bhopal</option>
              <option value="Indore">Indore</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Office / Work Hub Locality</label>
            <input 
              type="text" value={officeLocality}
              onChange={(e) => setOfficeLocality(e.target.value)}
              placeholder="e.g. MP Nagar, Whitefield..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Required Bedrooms</label>
            <select 
              value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
            >
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg glow-blue transition flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Evaluating Scored Matches...' : 'Generate Top 10 Recommended Properties'}</span>
        </button>
      </form>

      {/* Recommended Listings Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">AI Scored Matches ({recommendations.length})</h3>
          <span className="text-xs text-slate-400">Scored based on office proximity &amp; ROI</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((prop) => (
            <PropertyCard key={prop.id || prop._id} property={prop} />
          ))}
        </div>
      </div>

    </div>
  );
}
