const mongoose = require('mongoose');
const Property = require('../models/Property');
const Wishlist = require('../models/Wishlist');
const { initialProperties } = require('../utils/seedData');

// With no live MongoDB connection, Mongoose buffers queries rather than
// failing fast — `await Property.find()` would block for bufferTimeoutMS
// (10s) before rejecting. Check readyState first so the seed-data fallback
// is immediate instead of costing every request ten seconds.
const mongoReady = () => mongoose.connection.readyState === 1;

let inMemoryProperties = [...initialProperties];
let inMemoryWishlist = [];

exports.getAllProperties = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, bedrooms, furnished, search, status } = req.query;

    let properties = [];
    if (mongoReady()) {
      try {
        let query = {};
        if (status) query.status = status;
        else query.status = 'Approved';

        if (city && city !== 'All') query.city = new RegExp(city, 'i');
        if (bedrooms && bedrooms !== 'All') query.bedrooms = parseInt(bedrooms);
        if (furnished && furnished !== 'All') query.furnished = furnished;
        if (minPrice || maxPrice) {
          query.price_lakhs = {};
          if (minPrice) query.price_lakhs.$gte = parseFloat(minPrice);
          if (maxPrice) query.price_lakhs.$lte = parseFloat(maxPrice);
        }
        if (search) {
          query.$or = [
            { title: new RegExp(search, 'i') },
            { location: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
          ];
        }
        properties = await Property.find(query);
      } catch (err) {
        properties = [];
      }
    }

    if (properties.length === 0) {
      // Use in-memory properties
      properties = inMemoryProperties.filter(p => {
        if (status && p.status !== status) return false;
        if (city && city !== 'All' && p.city.toLowerCase() !== city.toLowerCase()) return false;
        if (bedrooms && bedrooms !== 'All' && p.bedrooms !== parseInt(bedrooms)) return false;
        if (furnished && furnished !== 'All' && p.furnished !== furnished) return false;
        if (minPrice && p.price_lakhs < parseFloat(minPrice)) return false;
        if (maxPrice && p.price_lakhs > parseFloat(maxPrice)) return false;
        if (search) {
          const s = search.toLowerCase();
          const match = p.title.toLowerCase().includes(s) || p.location.toLowerCase().includes(s) || p.city.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      });
    }

    res.json({ count: properties.length, properties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCities = async (req, res) => {
  try {
    const { listCities } = require('../services/propertyQuery');
    const { cities } = await listCities();
    res.json({ count: cities.length, cities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLocalities = async (req, res) => {
  try {
    const { city } = req.query;
    const { listLocalities } = require('../services/propertyQuery');
    const data = await listLocalities(city);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    let property = null;
    if (mongoReady()) {
      try {
        property = await Property.findById(id);
      } catch (err) {
        property = null;
      }
    }
    if (!property) {
      property = inMemoryProperties.find(p => p.id === id || p._id === id);
    }

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProperty = async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Auto calculate 5Y AI projection
    const growthRate = propertyData.city === 'Bengaluru' ? 0.095 : 0.075;
    const price5y = roundVal(propertyData.price_lakhs * Math.pow(1 + growthRate, 5));
    const roi5y = roundVal(((price5y - propertyData.price_lakhs) / propertyData.price_lakhs) * 100);

    const newProp = {
      ...propertyData,
      id: 'prop-' + Date.now(),
      _id: '650000000000000000' + Date.now().toString().slice(-6),
      predicted_price_5y: price5y,
      roi_5y_pct: roi5y,
      ai_rating: roundVal(7.5 + (roi5y / 15)),
      crime_score: 2.3,
      status: 'Approved', // Auto-approve for demo ease
      createdAt: new Date()
    };

    if (mongoReady()) {
      try {
        await Property.create(newProp);
      } catch (err) {
        inMemoryProperties.unshift(newProp);
      }
    } else {
      // No database — the listing survives only until this container recycles.
      inMemoryProperties.unshift(newProp);
    }

    res.status(201).json({ message: 'Property listed successfully', property: newProp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user ? req.user.id : 'demo-user';

    const index = inMemoryWishlist.findIndex(w => w.userId === userId && w.propertyId === propertyId);
    let saved = false;

    if (index > -1) {
      inMemoryWishlist.splice(index, 1);
      saved = false;
    } else {
      inMemoryWishlist.push({ userId, propertyId, createdAt: new Date() });
      saved = true;
    }

    res.json({ saved, message: saved ? 'Saved to wishlist' : 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'demo-user';
    const userWishlistPropIds = inMemoryWishlist.filter(w => w.userId === userId).map(w => w.propertyId);
    
    const savedProperties = inMemoryProperties.filter(p => userWishlistPropIds.includes(p.id) || userWishlistPropIds.includes(p._id));
    res.json({ wishlist: savedProperties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function roundVal(val) {
  return Math.round(val * 10) / 10;
}
