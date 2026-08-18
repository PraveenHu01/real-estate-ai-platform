import React, { createContext, useState, useEffect } from 'react';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('wishlist_ids');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Clean up legacy placeholder mock IDs if present
      if (Array.isArray(parsed)) {
        return parsed.filter(id => id !== 'prop-101' && id !== 'prop-104');
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('wishlist_ids', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const toggleWishlist = (propertyId) => {
    setWishlistIds(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  const isSaved = (propertyId) => wishlistIds.includes(propertyId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isSaved }}>
      {children}
    </WishlistContext.Provider>
  );
};
