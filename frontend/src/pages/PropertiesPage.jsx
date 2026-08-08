import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import { Search, Filter, SlidersHorizontal, MapPin, Building, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function PropertiesPage() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState('All');
  const [bedrooms, setBedrooms] = useState('All');
  const [furnished, setFurnished] = useState('All');
  const [maxPrice, setMaxPrice] = useState(400);

  useEffect(() => {
    fetchProperties();
  }, [city, bedrooms, furnished, maxPrice]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties', {
        params: { search, city, bedrooms, furnished, maxPrice }
      });
      setProperties(res.data.properties || []);
    } catch (err) {
      // Demo fallback
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
        },
        {
          id: "prop-104",
          title: "Ultra Tech 3BHK Residence Indiranagar",
          description: "Luxury 3BHK flat right off 100 Feet Road Indiranagar.",
          city: "Bengaluru",
          location: "Indiranagar",
          price_lakhs: 165.0,
          area_sqft: 1800,
          bedrooms: 3,
          bathrooms: 3,
          furnished: "Fully-Furnished",
          images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"],
          roi_5y_pct: 57.5,
          ai_rating: 9.7,
          isFeatured: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Smart Property Search &amp; Listings</h1>
          <p className="text-xs text-slate-400">Filter by target budget, city, BHK configuration, and furnished status</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-blue-400">
          Showing {properties.length} Verified Listings
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-5 rounded-2xl space-y-4">
        
        {/* Top Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="flex-1 flex items-center space-x-2 bg-slate-900 px-4 py-3 rounded-xl border border-slate-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by location, society, or title (e.g. MP Nagar, Vijay Nagar)..."
              className="bg-transparent text-sm text-white placeholder-slate-400 w-full focus:outline-none"
            />
          </div>
          <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition">
            Search
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
          
          <div>
            <label className="block text-slate-400 mb-1">Target City</label>
            <select 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="All">All Cities</option>
              <option value="Bhopal">Bhopal</option>
              <option value="Indore">Indore</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Bedrooms (BHK)</label>
            <select 
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="All">All BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Furnishing</label>
            <select 
              value={furnished}
              onChange={(e) => setFurnished(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Fully-Furnished">Fully-Furnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Max Budget:</span>
              <span className="text-blue-400 font-bold">₹{maxPrice} Lakhs</span>
            </div>
            <input 
              type="range" min="20" max="500" step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading properties...</div>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <PropertyCard key={prop.id || prop._id} property={prop} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <Building className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No properties match your current filter</h3>
          <p className="text-xs text-slate-400">Try broadening your budget slider or select "All Cities"</p>
        </div>
      )}

    </div>
  );
}
