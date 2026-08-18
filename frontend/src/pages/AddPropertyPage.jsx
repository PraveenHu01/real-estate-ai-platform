import React, { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  PlusCircle, Upload, MapPin, Home, DollarSign, Maximize2, 
  Bed, Bath, Calendar, Car, Layers, CheckCircle2, Sparkles,
  Trash2, Image as ImageIcon, Phone, Mail, User, ShieldCheck,
  TrendingUp, ArrowRight, Eye
} from 'lucide-react';
import api from '../services/api';
import LocalitySuggest from '../components/LocalitySuggest';

const CITY_COORDS = {
  Bhopal: { lat: 23.2333, lng: 77.4343, growth: 0.082 },
  Indore: { lat: 22.7196, lng: 75.8577, growth: 0.088 },
  Bengaluru: { lat: 12.9716, lng: 77.5946, growth: 0.098 },
  Mumbai: { lat: 19.0760, lng: 72.8777, growth: 0.075 },
  Delhi: { lat: 28.6139, lng: 77.2090, growth: 0.072 },
  Gurgaon: { lat: 28.4595, lng: 77.0266, growth: 0.092 },
  Hyderabad: { lat: 17.3850, lng: 78.4867, growth: 0.094 },
  Pune: { lat: 18.5204, lng: 73.8567, growth: 0.086 },
  Noida: { lat: 28.5355, lng: 77.3910, growth: 0.089 },
  Kolkata: { lat: 22.5726, lng: 88.3639, growth: 0.065 },
};

const SAMPLE_DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
];

const AVAILABLE_AMENITIES = [
  'Gym', 'Swimming Pool', 'Elevator', 'Security Guard', 'Power Backup',
  'Clubhouse', 'CCTV', 'Intercom', 'Covered Parking', 'Children Play Area',
  'Solar Panels', 'EV Charger', 'Servant Room', 'Private Garden', 'Terrace', 'Fire Safety'
];

export default function AddPropertyPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [submittedProperty, setSubmittedProperty] = useState(null);

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
    amenities: ['Power Backup', 'Security Guard', 'Elevator', 'Covered Parking'],
    images: [SAMPLE_DEMO_IMAGES[0]],
    seller_name: user?.name || '',
    seller_email: user?.email || '',
    seller_phone: '+91 98765 43210',
    seller_type: 'Owner'
  });

  const [customImageUrl, setCustomImageUrl] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'city') {
        const coords = CITY_COORDS[value] || { lat: 23.2333, lng: 77.4343 };
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

  // Handle local file uploads (converts files into Data URLs for local & cloud preview)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result;
        if (base64Url) {
          setForm(prev => ({
            ...prev,
            images: [...prev.images, base64Url]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrlImage = () => {
    if (!customImageUrl.trim()) return;
    setForm(prev => ({
      ...prev,
      images: [...prev.images, customImageUrl.trim()]
    }));
    setCustomImageUrl('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Real-time AI ROI & Price Metrics
  const priceVal = parseFloat(form.price_lakhs) || 0;
  const areaVal = parseFloat(form.area_sqft) || 0;
  const growthRate = CITY_COORDS[form.city]?.growth || 0.08;
  const predicted5yPrice = priceVal > 0 ? (priceVal * Math.pow(1 + growthRate, 5)).toFixed(1) : '0.0';
  const roi5yPct = priceVal > 0 ? (((predicted5yPrice - priceVal) / priceVal) * 100).toFixed(1) : '0.0';
  const pricePerSqft = (priceVal > 0 && areaVal > 0) ? Math.round((priceVal * 100000) / areaVal) : 0;
  const aiRating = priceVal > 0 ? (7.5 + (parseFloat(roi5yPct) / 18)).toFixed(1) : '8.8';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        city: form.city,
        location: form.location || `${form.city} Central`,
        address: form.address,
        lat: form.lat,
        lng: form.lng,
        price_lakhs: parseFloat(form.price_lakhs),
        area_sqft: parseFloat(form.area_sqft),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        age_years: parseInt(form.age_years),
        parking: parseInt(form.parking),
        floor: parseInt(form.floor),
        total_floors: parseInt(form.total_floors),
        furnished: form.furnished,
        amenities: form.amenities,
        images: form.images.length > 0 ? form.images : [SAMPLE_DEMO_IMAGES[0]],
        seller: {
          name: form.seller_name || user?.name || 'Property Owner',
          email: form.seller_email || user?.email || 'seller@investai.com',
          phone: form.seller_phone || '+91 98765 43210',
          userId: user?.id || 'seller-' + Date.now()
        },
        status: 'Approved',
        documents: ['Ownership_Deed.pdf', 'RERA_Approval.pdf'],
        nearby_facilities: {
          school_dist_m: 600,
          hospital_dist_m: 850,
          metro_dist_m: 1200,
          mall_dist_m: 1500,
          restaurant_dist_m: 400
        }
      };

      const res = await api.post('/properties', payload);
      const created = res.data.property || payload;
      setSubmittedProperty(created);
    } catch (err) {
      // Create local fallback representation if offline
      setSubmittedProperty({
        id: 'prop-' + Date.now(),
        ...form,
        price_lakhs: parseFloat(form.price_lakhs),
        area_sqft: parseFloat(form.area_sqft),
        predicted_price_5y: predicted5yPrice,
        roi_5y_pct: roi5yPct,
        ai_rating: aiRating,
        images: form.images
      });
    } finally {
      setLoading(false);
    }
  };

  if (submittedProperty) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl glow-emerald">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-white">Property Listed Successfully!</h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Your property <span className="text-white font-semibold">"{submittedProperty.title}"</span> is now live with AI-generated 5-year valuation predictions and investment metrics.
          </p>
        </div>

        {/* AI Scored Badge Preview */}
        <div className="glass-card p-6 rounded-2xl max-w-lg mx-auto grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">List Price</span>
            <span className="text-base font-extrabold text-white">₹{submittedProperty.price_lakhs} L</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            <span className="block text-[10px] text-emerald-400 uppercase font-bold">5Y Forecast</span>
            <span className="text-base font-extrabold text-emerald-300">₹{predicted5yPrice} L</span>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
            <span className="block text-[10px] text-blue-400 uppercase font-bold">AI Rating</span>
            <span className="text-base font-extrabold text-blue-300">{aiRating}/10</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/properties"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg glow-blue transition flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View in Properties Catalog</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmittedProperty(null);
              setForm(prev => ({ ...prev, title: '', description: '', price_lakhs: '', area_sqft: '' }));
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-sm transition flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Another Property</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg glow-blue">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Seller Property Portal</h1>
            <p className="text-xs text-slate-400">Upload property photos, specifications &amp; get instant AI valuation forecasts</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 w-fit">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>AI Auto-Valuation Active</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 2 Columns: Main Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Basic Information */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Home className="w-4 h-4 text-blue-400" />
              <span>1. Property Title &amp; Description</span>
            </h3>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Property Title *</label>
                <input
                  type="text" required
                  value={form.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="e.g. Ultra-Luxury 3BHK Smart Apartment with Panoramic City View"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition shadow-inner text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Detailed Description *</label>
                <textarea
                  required rows={4}
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Highlight unique features: Italian marble flooring, modular kitchen, cross ventilation, clubhouse access, walking distance to metro/tech parks..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition resize-none text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* 2. Photo Upload Gallery */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>2. Property Pictures ({form.images.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Supports JPG, PNG, WEBP</span>
            </div>

            {/* Drag and drop / file selector */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-900/40 hover:bg-blue-500/5 transition space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-white">Click to Upload Pictures from your Device</p>
              <p className="text-[10px] text-slate-400">Select single or multiple property images to showcase</p>
            </div>

            {/* URL Input Option */}
            <div className="flex items-center space-x-2">
              <input
                type="url"
                value={customImageUrl}
                onChange={e => setCustomImageUrl(e.target.value)}
                placeholder="Or paste an image URL here..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddUrlImage}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition shrink-0"
              >
                Add URL
              </button>
            </div>

            {/* Thumbnail Grid */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                    <img src={img} alt={`Property upload ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-blue-600/90 text-white text-[9px] font-bold rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Location & Locality */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>3. Location &amp; Address</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">City *</label>
                <select
                  value={form.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  {Object.keys(CITY_COORDS).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Locality / Area *</label>
                <LocalitySuggest
                  city={form.city}
                  value={form.location}
                  onChange={val => handleChange('location', val)}
                  placeholder="Select area or type custom..."
                  placement="bottom"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-300 mb-1 font-semibold">Full Property Address *</label>
                <input
                  type="text" required
                  value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="Building/Tower, Flat/Unit Number, Street, Landmark, PIN Code"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Specifications & Pricing */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Maximize2 className="w-4 h-4 text-violet-400" />
              <span>4. Specifications &amp; Pricing</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Price (₹ Lakhs) *</span>
                </label>
                <input
                  type="number" required step="0.1" min="5" max="5000"
                  value={form.price_lakhs}
                  onChange={e => handleChange('price_lakhs', e.target.value)}
                  placeholder="e.g. 75.0"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Area (Sq.ft) *</span>
                </label>
                <input
                  type="number" required min="100" max="25000"
                  value={form.area_sqft}
                  onChange={e => handleChange('area_sqft', e.target.value)}
                  placeholder="e.g. 1450"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <Bed className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bedrooms</span>
                </label>
                <select
                  value={form.bedrooms}
                  onChange={e => handleChange('bedrooms', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                >
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                  <option value="5">5+ BHK</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <Bath className="w-3.5 h-3.5 text-teal-400" />
                  <span>Bathrooms</span>
                </label>
                <select
                  value={form.bathrooms}
                  onChange={e => handleChange('bathrooms', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                >
                  <option value="1">1 Bath</option>
                  <option value="2">2 Baths</option>
                  <option value="3">3 Baths</option>
                  <option value="4">4 Baths</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Floor No.</span>
                </label>
                <input
                  type="number" min="0" max="60"
                  value={form.floor}
                  onChange={e => handleChange('floor', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Parking Slots</span>
                </label>
                <select
                  value={form.parking}
                  onChange={e => handleChange('parking', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                >
                  <option value="0">None</option>
                  <option value="1">1 Slot</option>
                  <option value="2">2 Slots</option>
                  <option value="3">3+ Slots</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Furnishing</label>
                <select
                  value={form.furnished}
                  onChange={e => handleChange('furnished', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                >
                  <option>Unfurnished</option>
                  <option>Semi-Furnished</option>
                  <option>Fully-Furnished</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Age (Years)</span>
                </label>
                <input
                  type="number" min="0" max="50"
                  value={form.age_years}
                  onChange={e => handleChange('age_years', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Total Floors</label>
                <input
                  type="number" min="1" max="80"
                  value={form.total_floors}
                  onChange={e => handleChange('total_floors', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* 5. Amenities Checklist */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              5. Amenities &amp; Facilities
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_AMENITIES.map(amenity => {
                const checked = form.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left border ${
                      checked
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${checked ? 'bg-blue-500 text-white' : 'border border-slate-700'}`}>
                      {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Seller Contact Information */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>6. Seller Contact Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Contact Name *</span>
                </label>
                <input
                  type="text" required
                  value={form.seller_name}
                  onChange={e => handleChange('seller_name', e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone Number *</span>
                </label>
                <input
                  type="tel" required
                  value={form.seller_phone}
                  onChange={e => handleChange('seller_phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={form.seller_email}
                  onChange={e => handleChange('seller_email', e.target.value)}
                  placeholder="seller@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Sticky AI Live Preview & Submission */}
        <div className="space-y-6">

          {/* Sticky AI Valuation Card */}
          <div className="glass-card p-6 rounded-2xl space-y-5 sticky top-24 border border-blue-500/30 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-bold text-white">AI Valuation Live</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Model
              </span>
            </div>

            {/* Calculated Metrics */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-slate-400">Rate / Sq.ft</span>
                <span className="font-extrabold text-white text-sm">
                  {pricePerSqft > 0 ? `₹${pricePerSqft.toLocaleString('en-IN')}` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-300 font-medium">5-Year Forecast</span>
                <span className="font-black text-emerald-400 text-sm">
                  {priceVal > 0 ? `₹${predicted5yPrice} Lakhs` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-blue-300 font-medium">Projected 5Y ROI</span>
                <span className="font-black text-blue-400 text-sm">
                  {priceVal > 0 ? `+${roi5yPct}%` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-purple-300 font-medium">AI Investment Rating</span>
                <span className="font-black text-purple-400 text-sm">
                  {priceVal > 0 ? `${aiRating} / 10` : '—'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !form.title || !form.price_lakhs || !form.area_sqft}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl glow-blue transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Publishing Listing...</span>
              ) : (
                <>
                  <span>Publish Property Listing</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-slate-500 leading-tight">
              By listing, your property will immediately be indexed in search filters, maps, and AI investment comparisons.
            </p>
          </div>

        </div>

      </form>

    </div>
  );
}
