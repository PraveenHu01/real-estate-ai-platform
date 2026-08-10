import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/PropertyCard';
import { Sparkles, Compass, AlertCircle, Loader2, FlaskConical } from 'lucide-react';
import api from '../services/api';

// Weight labels mirror scoring_weights returned by /ai/recommend. Keeping the
// order fixed makes the bars comparable across cards.
const BREAKDOWN_FIELDS = [
  ['budget_fit', 'Budget'],
  ['roi_potential', 'ROI'],
  ['proximity', 'Proximity'],
  ['safety', 'Safety'],
  ['locality_match', 'Locality'],
];

function scoreTone(score) {
  if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  if (score >= 60) return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
  return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
}

export default function AIRecommendationsPage() {
  const [budget, setBudget] = useState(60);
  // 'All' matches the first option, so the select never displays a city the
  // state does not actually hold while the city list is still loading.
  const [preferredCity, setPreferredCity] = useState('All');
  const [bedrooms, setBedrooms] = useState('');       // '' = no bedroom filter
  const [officeLocality, setOfficeLocality] = useState('');
  const [cities, setCities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState(null);         // 'catalogue' | 'modelled'
  const [searched, setSearched] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Every market the platform can price, not just those with live listings.
  useEffect(() => {
    api.get('/properties/cities')
      .then((res) => setCities(res.data.cities || []))
      .catch(() => setCities([]));
  }, []);

  // Show a sensible default set before the user has run a search.
  useEffect(() => {
    api.get('/properties', { params: { city: 'All' } })
      .then((res) => setRecommendations((res.data.properties || []).slice(0, 6)))
      .catch(() => setRecommendations([]));
  }, []);

  const handleRecommend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        budget_lakhs: parseFloat(budget),
        preferred_city: preferredCity,
        preferred_locality: officeLocality.trim() || undefined,
      };
      // Omit the key entirely for "Any" — sending NaN would filter everything out.
      if (bedrooms !== '') payload.bedrooms = parseInt(bedrooms, 10);

      const res = await api.post('/ai/recommend', payload);
      setRecommendations(res.data.recommendations || []);
      setSource(res.data.source || null);
      setSearched(true);
    } catch (err) {
      // Surfaced rather than swallowed — a silent failure here is
      // indistinguishable from "the AI found nothing".
      setError(
        err.response?.data?.message ||
        err.message ||
        'Could not reach the recommendation engine.'
      );
      setRecommendations([]);
      setSearched(true);
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
              <option value="All">All India</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city}{c.listings ? ` (${c.listings})` : ' — modelled'}
                </option>
              ))}
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
              <option value="">Any</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
            </select>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg glow-blue transition flex items-center justify-center space-x-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? 'Evaluating Scored Matches...' : 'Generate AI-Scored Recommendations'}</span>
        </button>
      </form>

      {error && (
        <div className="flex items-start space-x-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {source === 'modelled' && !error && recommendations.length > 0 && (
        <div className="flex items-start space-x-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <FlaskConical className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            No live listings in {preferredCity} yet. These are <strong>modelled estimates</strong> built
            from that market&apos;s price and growth profile — indicative figures, not properties for sale.
          </span>
        </div>
      )}

      {/* Recommended Listings Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">AI Scored Matches ({recommendations.length})</h3>
          <span className="text-xs text-slate-400">Scored on budget, ROI, proximity, safety &amp; locality</span>
        </div>

        {recommendations.length === 0 && !loading && (
          <div className="glass-card rounded-2xl p-10 text-center space-y-2">
            <Compass className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">
              {searched ? 'No matches for those criteria' : 'Set your criteria to see scored matches'}
            </p>
            {searched && !error && (
              <p className="text-xs text-slate-400">
                Try raising the budget, choosing “Any” bedrooms, or widening the city to All India.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((prop) => (
            <div key={prop.id || prop._id} className="flex flex-col">
              <PropertyCard property={prop} />

              {/* The scoring the engine actually produced. Without this the
                  page rendered an ordinary property list and the weighting
                  was invisible. */}
              {prop.ai_match_score != null && (
                <div className="glass-card border-t-0 rounded-b-2xl -mt-2 pt-4 px-5 pb-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {prop.modelled ? (
                        <span className="inline-flex items-center space-x-1 text-amber-400">
                          <FlaskConical className="w-3 h-3" />
                          <span>Modelled</span>
                        </span>
                      ) : 'AI Match'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg border font-black text-xs ${scoreTone(prop.ai_match_score)}`}>
                      {prop.ai_match_score}%
                    </span>
                  </div>

                  {prop.match_breakdown && (
                    <div className="space-y-1.5">
                      {BREAKDOWN_FIELDS.map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <span className="w-16 shrink-0 text-[10px] text-slate-400">{label}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              style={{ width: `${Math.max(0, Math.min(100, prop.match_breakdown[key] ?? 0))}%` }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right text-[10px] font-semibold text-slate-300">
                            {prop.match_breakdown[key] ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {prop.above_budget && (
                    <p className="text-[10px] text-amber-300">
                      Above your budget — closest option in this market.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
