import React, { useContext, useEffect, useState } from 'react';
import PropertyCard from '../components/PropertyCard';
import { WishlistContext } from '../context/WishlistContext';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import api from '../services/api';

export default function WishlistPage() {
  const { wishlistIds } = useContext(WishlistContext);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetchWishlistProperties();
  }, [wishlistIds]);

  const fetchWishlistProperties = async () => {
    try {
      const res = await api.get('/properties');
      const all = res.data.properties || [];
      const saved = all.filter(p => wishlistIds.includes(p.id) || wishlistIds.includes(p._id));
      setProperties(saved);
    } catch (err) {
      setProperties([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <BookmarkCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Your Saved Wishlist</h1>
          <p className="text-xs text-slate-400">Bookmarked properties saved for investment evaluation ({wishlistIds.length})</p>
        </div>
      </div>

      {properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map(p => (
            <PropertyCard key={p.id || p._id} property={p} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-16 text-center space-y-4">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-400">Click the bookmark icon on any property card to save it here!</p>
        </div>
      )}

    </div>
  );
}
