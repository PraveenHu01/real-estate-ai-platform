const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  city: { type: String, required: true }, // e.g. Bhopal, Indore, Bengaluru, Mumbai, Delhi
  location: { type: String, required: true }, // e.g. MP Nagar, Vijay Nagar, Indiranagar
  address: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  price_lakhs: { type: Number, required: true },
  area_sqft: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  age_years: { type: Number, default: 2 },
  parking: { type: Number, default: 1 },
  floor: { type: Number, default: 2 },
  total_floors: { type: Number, default: 8 },
  furnished: { type: String, enum: ['Unfurnished', 'Semi-Furnished', 'Fully-Furnished'], default: 'Semi-Furnished' },
  images: [{ type: String }],
  documents: [{ type: String }],
  amenities: [{ type: String }],
  seller: {
    name: { type: String, default: 'Rajesh Sharma' },
    email: { type: String, default: 'seller@realestateai.com' },
    phone: { type: String, default: '+91 98765 43210' },
    userId: { type: String }
  },
  status: { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Approved' },
  isFeatured: { type: Boolean, default: false },
  // AI Metrics
  predicted_price_5y: { type: Number },
  roi_5y_pct: { type: Number },
  ai_rating: { type: Number, default: 9.1 },
  crime_score: { type: Number, default: 2.2 },
  nearby_facilities: {
    school_dist_m: { type: Number, default: 500 },
    hospital_dist_m: { type: Number, default: 800 },
    metro_dist_m: { type: Number, default: 1200 },
    mall_dist_m: { type: Number, default: 1500 },
    restaurant_dist_m: { type: Number, default: 350 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', propertySchema);
