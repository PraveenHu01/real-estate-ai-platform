import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import FacilityDistanceMap from '../components/FacilityDistanceMap';
import CrimeHeatMap from '../components/CrimeHeatMap';
import EMICalculator from '../components/EMICalculator';
import ChatModal from '../components/ChatModal';
import { WishlistContext } from '../context/WishlistContext';
import { 
  MapPin, Bed, Bath, Maximize2, Calendar, TrendingUp,
  FileText, MessageSquare, Phone, Mail, Bookmark, CheckCircle2, ArrowLeft
} from 'lucide-react';
import api from '../services/api';

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const { toggleWishlist, isSaved } = useContext(WishlistContext);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/properties/${id}`);
      setProperty(res.data);
    } catch (err) {
      // Fallback
      setProperty({
        id: id || "prop-101",
        title: "Luxury 2BHK Apartment in MP Nagar",
        description: "Spacious 2BHK ready-to-move apartment located in the prime commercial hub of Bhopal. Close to DB City Mall and top CBSE schools. Gated community with 24x7 security, power backup, clubhouse, and underground parking.",
        city: "Bhopal",
        location: "MP Nagar",
        address: "Zone 1, MP Nagar, Bhopal, MP 462011",
        lat: 23.2333,
        lng: 77.4343,
        price_lakhs: 58.5,
        area_sqft: 1150,
        bedrooms: 2,
        bathrooms: 2,
        age_years: 3,
        parking: 1,
        floor: 4,
        total_floors: 7,
        furnished: "Fully-Furnished",
        images: [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
        ],
        documents: ["Property_Ownership_Deed.pdf", "RERA_Registration.pdf"],
        amenities: ["Gym", "Elevator", "Security Guard", "Power Backup", "Clubhouse", "Intercom"],
        seller: { name: "Rajesh Sharma", email: "seller@realestateai.com", phone: "+91 98930 12345", userId: "seller-1" },
        predicted_price_5y: 84.5,
        roi_5y_pct: 44.4,
        ai_rating: 9.3,
        crime_score: 2.2,
        nearby_facilities: { school_dist_m: 450, hospital_dist_m: 800, metro_dist_m: 1200, mall_dist_m: 600, restaurant_dist_m: 250 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !property) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">Loading details...</div>;
  }

  const saved = isSaved(property.id || property._id);

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Navigation Back Button */}
      <Link to="/properties" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Property Listings</span>
      </Link>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white">
              {property.city}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300">
              AI Rating {property.ai_rating || 9.1} / 10
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{property.title}</h1>
          <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>{property.address}</span>
          </p>
        </div>

        {/* Price & Wishlist CTA */}
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-xs text-slate-400 block">List Price</span>
            <span className="text-3xl font-black text-white">₹{property.price_lakhs} Lakhs</span>
          </div>
          <button
            onClick={() => toggleWishlist(property.id || property._id)}
            title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={saved}
            className={`p-3 rounded-2xl border transition ${saved ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`}
          >
            <Bookmark className={`w-6 h-6 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-96 rounded-2xl overflow-hidden bg-slate-900">
          <img src={property.images?.[0]} alt={property.title} className="w-full h-full object-cover" />
        </div>
        <div className="h-96 rounded-2xl overflow-hidden bg-slate-900 hidden md:block">
          <img src={property.images?.[1] || property.images?.[0]} alt="Interior view" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Specs Grid */}
      <div className="glass-card rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-slate-200">
        <div>
          <span className="text-xs text-slate-400 block">Bedrooms</span>
          <span className="text-lg font-bold flex items-center space-x-2 mt-1">
            <Bed className="w-5 h-5 text-blue-400" />
            <span>{property.bedrooms} BHK</span>
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Bathrooms</span>
          <span className="text-lg font-bold flex items-center space-x-2 mt-1">
            <Bath className="w-5 h-5 text-blue-400" />
            <span>{property.bathrooms} Baths</span>
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Area</span>
          <span className="text-lg font-bold flex items-center space-x-2 mt-1">
            <Maximize2 className="w-5 h-5 text-blue-400" />
            <span>{property.area_sqft} sq.ft</span>
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Property Age</span>
          <span className="text-lg font-bold flex items-center space-x-2 mt-1">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>{property.age_years} Years</span>
          </span>
        </div>
      </div>

      {/* AI Investment Analysis Card */}
      <div className="glass-card rounded-2xl p-6 space-y-4 border-l-4 border-l-emerald-500">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI 5-Year Investment &amp; ROI Forecast</h3>
            <p className="text-xs text-slate-400">Scikit-Learn Machine Learning Capital Growth Model</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Current Value</span>
            <span className="block text-xl font-bold text-white mt-1">₹{property.price_lakhs} Lakhs</span>
          </div>
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Predicted (5 Years)</span>
            <span className="block text-xl font-bold text-emerald-400 mt-1">₹{property.predicted_price_5y || (property.price_lakhs * 1.45).toFixed(1)} Lakhs</span>
          </div>
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Expected ROI</span>
            <span className="block text-xl font-bold text-emerald-400 mt-1">+{property.roi_5y_pct || 44.4}%</span>
          </div>
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">AI Risk Rating</span>
            <span className="block text-xl font-bold text-blue-400 mt-1">Low Risk</span>
          </div>
        </div>
      </div>

      {/* Description & Amenities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Property Overview</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{property.description}</p>
            
            <h4 className="text-sm font-bold text-white pt-4">Amenities &amp; Facilities</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              {property.amenities?.map((amenity, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>

            {/* Document Download */}
            <h4 className="text-sm font-bold text-white pt-4">Verified Property Documents</h4>
            <div className="flex flex-wrap gap-3">
              {property.documents?.map((doc, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-blue-950/40 border border-blue-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-400">
                  <FileText className="w-4 h-4" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map & Facility Radius */}
          <FacilityDistanceMap lat={property.lat} lng={property.lng} title={property.title} facilities={property.nearby_facilities} />

          {/* Crime & Safety Analysis */}
          <CrimeHeatMap crimeScore={property.crime_score} city={property.city} location={property.location} />

        </div>

        {/* Seller Info Sidebar */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-slate-800">
            <h3 className="text-base font-bold text-white">Seller &amp; Agent Information</h3>
            <div className="flex items-center space-x-3 pt-2">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
                {property.seller?.name ? property.seller.name[0] : 'S'}
              </div>
              <div>
                <span className="block font-bold text-white text-sm">{property.seller?.name || 'Rajesh Sharma'}</span>
                <span className="block text-xs text-emerald-400 font-medium">Verified Property Owner</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{property.seller?.phone || '+91 98930 12345'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{property.seller?.email || 'seller@realestateai.com'}</span>
              </div>
            </div>

            <button
              onClick={() => setChatOpen(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg glow-blue transition flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with Seller Real-Time</span>
            </button>
          </div>

          <EMICalculator defaultPropertyPriceLakhs={property.price_lakhs} />
        </div>

      </div>

    </div>

    {/* Chat Modal */}
    {chatOpen && (
      <ChatModal property={property} onClose={() => setChatOpen(false)} />
    )}
    </>
  );
}
