import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import EMICalculator from '../components/EMICalculator';
import { 
  Sparkles, TrendingUp, ShieldCheck, Building2, Search, ArrowRight, 
  MapPin, Award, CheckCircle, BarChart3, Calculator, Compass 
} from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProperties();
  }, [selectedCity]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties', { params: { city: selectedCity } });
      setProperties(res.data.properties || []);
    } catch (err) {
      // Fallback
      setProperties([
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
        },
        {
          id: "prop-103",
          title: "High-Rise 2BHK Smart Home",
          description: "Contemporary 2BHK flat in the IT corridor of Vijay Nagar, Indore.",
          city: "Indore",
          location: "Vijay Nagar",
          price_lakhs: 64.0,
          area_sqft: 1220,
          bedrooms: 2,
          bathrooms: 2,
          furnished: "Fully-Furnished",
          images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"],
          roi_5y_pct: 52.3,
          ai_rating: 9.6,
          isFeatured: true
        }
      ]);
    }
  };

  const cities = ["All", "Bhopal", "Indore", "Bengaluru", "Mumbai", "Delhi"];

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Glowing Ambient Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Real Estate Investment Engine 2026</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Invest Smarter with <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">AI Price Prediction</span> &amp; ROI Analytics
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Predict property prices using Scikit-Learn Random Forest models, analyze 5-year expected returns, evaluate neighborhood crime scores, and discover high-yielding properties in Bhopal, Indore, Bengaluru, Mumbai, &amp; Delhi.
          </p>

          {/* Search Bar Widget */}
          <div className="max-w-3xl mx-auto glass-card p-3 rounded-2xl shadow-2xl border border-slate-700/80">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 flex items-center space-x-2 bg-slate-900/90 px-4 py-3 rounded-xl border border-slate-800 w-full">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search locality, city, or society (e.g. MP Nagar Bhopal)..."
                  className="bg-transparent text-sm text-white placeholder-slate-400 w-full focus:outline-none"
                />
              </div>

              <Link 
                to={`/properties?search=${searchQuery}`}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg glow-blue transition flex items-center justify-center space-x-2"
              >
                <span>Search Properties</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick City Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-blue-400" /> Select City:
            </span>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedCity === city
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glass-card rounded-2xl p-6 space-y-3 border-l-4 border-l-blue-500">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Price Prediction ⭐⭐⭐⭐⭐</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trained on Indian city metrics using Random Forest regression. Estimates realistic property market values based on location, area, floor, age, and parking.
            </p>
            <Link to="/price-predictor" className="inline-flex items-center space-x-1 text-xs font-bold text-blue-400 hover:text-blue-300">
              <span>Try Price Predictor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3 border-l-4 border-l-emerald-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Investment ROI Forecast</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculate projected property value growth across 1-year, 3-year, and 5-year horizons with expected compound ROI % and AI risk scoring.
            </p>
            <Link to="/investment-analysis" className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400 hover:text-emerald-300">
              <span>Analyze Growth</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3 border-l-4 border-l-purple-500">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Crime &amp; Facility Radius</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-calculate exact walking/driving distance to schools, metro stations, hospitals, and check localized safety index scores.
            </p>
            <Link to="/ai-recommendations" className="inline-flex items-center space-x-1 text-xs font-bold text-purple-400 hover:text-purple-300">
              <span>Smart Recommend</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Top Investment Properties ({selectedCity})</h2>
            <p className="text-xs text-slate-400">Properties rated highest for capital appreciation &amp; neighborhood safety</p>
          </div>
          <Link to="/properties" className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1">
            <span>View All Listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.slice(0, 6).map((prop) => (
            <PropertyCard key={prop.id || prop._id} property={prop} />
          ))}
        </div>
      </section>

      {/* Mortgage & EMI Tool embedded */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EMICalculator defaultPropertyPriceLakhs={65} />
      </section>

    </div>
  );
}
