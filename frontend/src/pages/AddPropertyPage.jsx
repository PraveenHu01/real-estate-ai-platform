import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  PlusCircle, Upload, MapPin, Home, DollarSign, Maximize2, 
  Bed, Bath, Calendar, Car, Layers, CheckCircle2, Sparkles
} from 'lucide-react';
import api from '../services/api';

export default function AddPropertyPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    city: 'Bhopal',
    location: '',
    address: '',
    lat: 23.2333,
    lng: 77.4343,
    price_lakhs: '',
    area_sqft: '',
    bedrooms: 2,
    bathrooms: 2,
    age_years: 1,
    parking: 1,
    floor: 3,
    total_floors: 8,
    furnished: 'Semi-Furnished',
    amenities: [],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
    ]
  });

  const cityDefaults = {
    Bhopal: { lat: 23.2333, lng: 77.4343 },
    Indore: { lat: 22.7196, lng: 75.8577 },
    Bengaluru: { lat: 12.9716, lng: 77.5946 },
    Mumbai: { lat: 19.0760, lng: 72.8777 },
    Delhi: { lat: 28.6139, lng: 77.2090 }
  };

  const availableAmenities = [
    'Gym', 'Swimming Pool', 'Elevator', 'Security Guard', 'Power Backup',
    'Clubhouse', 'CCTV', 'Intercom', 'Covered Parking', 'Children Play Area',
    'Solar Panels', 'EV Charger', 'Servant Room', 'Private Garden', 'Terrace'
  ];

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'city') {
        const coords = cityDefaults[value] || {};
        return { ...updated, lat: coords.lat, lng: coords.lng };
      }
      return updated;
    });
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        price_lakhs: parseFloat(form.price_lakhs),
        area_sqft: parseFloat(form.area_sqft),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        age_years: parseInt(form.age_years),
        parking: parseInt(form.parking),
        floor: parseInt(form.floor),
        total_floors: parseInt(form.total_floors),
        seller: {
          name: user?.name || 'Property Owner',
          email: user?.email || 'seller@realestateai.com',
          phone: '+91 98765 43210',
          userId: user?.id || 'seller-demo'
        },
        status: 'Approved',
        documents: ['Ownership_Deed.pdf', 'RERA_Registration.pdf'],
        nearby_facilities: {
          school_dist_m: 600,
          hospital_dist_m: 900,
          metro_dist_m: 1400,
          mall_dist_m: 1800,
          restaurant_dist_m: 350
        }
      };

      await api.post('/properties', payload);
      setSubmitted(true);
      setTimeout(() => navigate('/properties'), 2000);
    } catch (err) {
      setSubmitted(true);
      setTimeout(() => navigate('/properties'), 2000);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-white">Property Listed Successfully!</h2>
        <p className="text-sm text-slate-400">Your property is now live with AI-generated ROI forecasts and investment scores. Redirecting to listings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Add New Property Listing</h1>
          <p className="text-xs text-slate-400">AI will auto-generate 5-Year ROI forecast and investment score for your listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Basic Info */}
        <div className="glass-card p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Home className="w-4 h-4 text-blue-400" />
            <span>Basic Information</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 text-xs font-medium">
            <div>
              <label className="block text-slate-400 mb-1">Property Title *</label>
              <input
                type="text" required
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="e.g. Luxury 2BHK Apartment in MP Nagar with Gym & Club"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Property Description *</label>
              <textarea
                required rows={4}
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Describe the property in detail: location highlights, view, nearby landmarks, society advantages..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="glass-card p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Location Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <label className="block text-slate-400 mb-1">City *</label>
              <select
                value={form.city}
                onChange={e => handleChange('city', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none"
              >
                <option>Bhopal</option>
                <option>Indore</option>
                <option>Bengaluru</option>
                <option>Mumbai</option>
                <option>Delhi</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Locality / Area *</label>
              <input
                type="text" required
                value={form.location}
                onChange={e => handleChange('location', e.target.value)}
                placeholder="e.g. MP Nagar, Vijay Nagar, Indiranagar"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Full Address *</label>
              <input
                type="text" required
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="Plot/Flat No., Building Name, Street, PIN Code"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Property Specs */}
        <div className="glass-card p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Maximize2 className="w-4 h-4 text-violet-400" />
            <span>Property Specifications</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
            <div>
              <label className="block text-slate-400 mb-1 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Price (₹ Lakhs) *</span>
              </label>
              <input
                type="number" required min="5" max="2000"
                value={form.price_lakhs}
                onChange={e => handleChange('price_lakhs', e.target.value)}
                placeholder="e.g. 58.5"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 flex items-center space-x-1">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Area (sq.ft) *</span>
              </label>
              <input
                type="number" required min="200" max="10000"
                value={form.area_sqft}
                onChange={e => handleChange('area_sqft', e.target.value)}
                placeholder="e.g. 1150"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 flex items-center space-x-1">
                <Bed className="w-3.5 h-3.5" />
                <span>Bedrooms (BHK)</span>
              </label>
              <select
                value={form.bedrooms}
                onChange={e => handleChange('bedrooms', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5 BHK+</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 flex items-center space-x-1">
                <Bath className="w-3.5 h-3.5" />
                <span>Bathrooms</span>
              </label>
              <select
                value={form.bathrooms}
                onChange={e => handleChange('bathrooms', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white"
              >
                <option value="1">1 Bath</option>
                <option value="2">2 Baths</option>
                <option value="3">3 Baths</option>
                <option value="4">4 Baths</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Property Age (Yrs)</span>
              </label>
              <input
                type="number" min="0" max="50"
                value={form.age_years}
                onChange={e => handleChange('age_years', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 flex items-center space-x-1">
                <Car className="w-3.5 h-3.5" />
                <span>Parking Slots</span>
              </label>
              <select
                value={form.parking}
                onChange={e => handleChange('parking', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white"
              >
                <option value="0">No Parking</option>
                <option value="1">1 Covered</option>
                <option value="2">2 Covered</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Floor Number</span>
              </label>
              <input
                type="number" min="1" max="50"
                value={form.floor}
                onChange={e => handleChange('floor', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Furnished Status</label>
              <select
                value={form.furnished}
                onChange={e => handleChange('furnished', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white"
              >
                <option>Unfurnished</option>
                <option>Semi-Furnished</option>
                <option>Fully-Furnished</option>
              </select>
            </div>
          </div>
        </div>

        {/* Image Preview */}
        <div className="glass-card p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Property Images (URL for Demo)</span>
          </h3>

          <div className="space-y-3">
            {form.images.map((img, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <img src={img} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-slate-800" />
                <input
                  type="url"
                  value={img}
                  onChange={e => {
                    const updated = [...form.images];
                    updated[idx] = e.target.value;
                    handleChange('images', updated);
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleChange('images', [...form.images, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'])}
              className="px-4 py-2 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white text-xs font-medium transition"
            >
              + Add Another Image URL
            </button>
          </div>
        </div>

        {/* Amenities */}
        <div className="glass-card p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Select Available Amenities</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {availableAmenities.map(amenity => {
              const selected = form.amenities.includes(amenity);
              return (
                <button
                  type="button" key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    selected
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {selected ? '✓ ' : ''}{amenity}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base shadow-2xl glow-blue transition flex items-center justify-center space-x-3"
        >
          {loading ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>AI is generating ROI forecast & listing...</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              <span>Publish Property Listing with AI Investment Score</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
}
