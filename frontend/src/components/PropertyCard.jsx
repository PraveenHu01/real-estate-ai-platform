import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { WishlistContext } from '../context/WishlistContext';
import { Bookmark, MapPin, Bed, Bath, Maximize2, TrendingUp, Star, ShieldCheck } from 'lucide-react';

export default function PropertyCard({ property }) {
  const { toggleWishlist, isSaved } = useContext(WishlistContext);
  const propId = property.id || property._id;
  const saved = isSaved(propId);

  const priceDisplay = property.price_lakhs >= 100 
    ? `₹${(property.price_lakhs / 100).toFixed(2)} Cr` 
    : `₹${property.price_lakhs} Lakhs`;

  return (
    <div className="glass-card rounded-2xl overflow-hidden group hover:border-slate-700 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      <div>
        {/* Card Header Image */}
        <div className="relative h-52 overflow-hidden bg-slate-900">
          <img 
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'} 
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30" />

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white backdrop-blur-md">
              {property.city}
            </span>
            {property.isFeatured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white backdrop-blur-md flex items-center space-x-1">
                <Star className="w-3 h-3 fill-current" />
                <span>Featured</span>
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(propId); }}
            title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={saved}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${saved ? 'bg-blue-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:text-white'}`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>

          {/* Price Tag Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div>
              <span className="text-xl font-black text-white drop-shadow-md">{priceDisplay}</span>
              <span className="block text-[11px] text-slate-300 font-medium">₹{Math.round((property.price_lakhs * 100000) / property.area_sqft)} / sq.ft</span>
            </div>
            {property.roi_5y_pct && (
              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center space-x-1 backdrop-blur-md">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{property.roi_5y_pct}% (5Y)</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <Link to={`/property/${propId}`} className="block">
            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition line-clamp-1">
              {property.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-400 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="line-clamp-1">{property.location}, {property.city}</span>
          </p>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Bed className="w-4 h-4 text-slate-400" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Bath className="w-4 h-4 text-slate-400" />
              <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Maximize2 className="w-4 h-4 text-slate-400" />
              <span>{property.area_sqft} sqft</span>
            </div>
          </div>

          {/* AI Metrics Bar */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center space-x-1 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safety: <strong className="text-slate-200">{property.crime_score ? 'High' : 'Safe'}</strong></span>
            </div>
            <div className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-[11px]">
              AI Rating {property.ai_rating || 9.1}/10
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 pt-0 border-t border-slate-800/40">
        <Link 
          to={`/property/${propId}`} 
          className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-600 text-slate-200 hover:text-white font-semibold text-xs transition flex items-center justify-center space-x-2"
        >
          <span>View Property & AI Forecast</span>
        </Link>
      </div>
    </div>
  );
}
