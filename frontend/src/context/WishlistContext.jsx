import React, { createContext, useState, useEffect } from 'react';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState(() => {
    const saved = localStorage.getItem('wishlist_ids');
    return saved ? JSON.parse(saved) : ['prop-101', 'prop-104'];
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
