const mongoose = require('mongoose');
const Property = require('../models/Property');
const { initialProperties } = require('../utils/seedData');

// Data-access layer behind the AI's tool calls.
//
// Every function here is reachable by the LLM, so each one is read-only,
// returns a bounded number of rows, and strips fields the model has no use
// for (images, documents, seller contact details). The model never sees a
// raw query — it passes structured filters and gets back projected rows.

const MAX_ROWS = 12;

/**
 * Fields the model actually reasons over. Keeps tool results small.
 *
 * `withMedia` adds the display fields the property cards need. It stays off
 * for LLM tool calls — image URLs are pure token cost the model cannot use —
 * and on for HTTP callers that render the rows.
 */
function project(p, { withMedia = false } = {}) {
  const base = {
    id: p.id || String(p._id),
    title: p.title,
    city: p.city,
    location: p.location,
    price_lakhs: p.price_lakhs,
    area_sqft: p.area_sqft,
    price_per_sqft: Math.round((p.price_lakhs * 100000) / p.area_sqft),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    age_years: p.age_years,
    furnished: p.furnished,
    roi_5y_pct: p.roi_5y_pct,
    ai_rating: p.ai_rating,
    crime_score: p.crime_score,
    school_dist_m: p.nearby_facilities?.school_dist_m,
    hospital_dist_m: p.nearby_facilities?.hospital_dist_m,
    metro_dist_m: p.nearby_facilities?.metro_dist_m,
  };

  if (!withMedia) return base;

  return {
    ...base,
    _id: p._id,
    images: p.images,
    description: p.description,
    isFeatured: p.isFeatured,
    predicted_price_5y: p.predicted_price_5y,
    nearby_facilities: p.nearby_facilities,
  };
}

/**
 * Read the whole approved catalogue. Prefers MongoDB, falls back to the
 * in-memory seed set — same contract as propertyController.
 *
 * The readyState check matters: with no live connection Mongoose *buffers*
 * the query instead of failing fast, so `await Property.find()` would sit for
 * bufferTimeoutMS (10s by default) before rejecting. On a deployment without
 * MONGO_URI that turned every property request into a 10-second stall.
 */
async function loadAll() {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await Property.find({ status: 'Approved' }).lean();
      if (docs && docs.length > 0) return docs;
    } catch {
      // Fall through to seed data.
    }
  }
  return initialProperties.filter((p) => p.status === 'Approved');
}

/**
 * Structured property search. Every filter is optional; omitted filters do
 * not constrain the result. Results are ranked by the requested sort and
 * capped at MAX_ROWS.
 */
async function searchProperties(filters = {}) {
  const {
    city,
    location,
    min_price_lakhs,
    max_price_lakhs,
    bedrooms,
    min_area_sqft,
    furnished,
    max_school_dist_m,
    max_hospital_dist_m,
    max_metro_dist_m,
    max_crime_score,
    sort_by = 'ai_rating',
    limit = MAX_ROWS,
    with_media = false,
  } = filters;

  const all = await loadAll();

  const matched = all.filter((p) => {
    if (city && city !== 'All' && p.city.toLowerCase() !== String(city).toLowerCase()) return false;
    if (location && !p.location.toLowerCase().includes(String(location).toLowerCase())) return false;
    if (min_price_lakhs != null && p.price_lakhs < min_price_lakhs) return false;
    if (max_price_lakhs != null && p.price_lakhs > max_price_lakhs) return false;
    if (bedrooms != null && p.bedrooms !== Number(bedrooms)) return false;
    if (min_area_sqft != null && p.area_sqft < min_area_sqft) return false;
    if (furnished && p.furnished !== furnished) return false;

    const f = p.nearby_facilities || {};
    if (max_school_dist_m != null && (f.school_dist_m ?? Infinity) > max_school_dist_m) return false;
    if (max_hospital_dist_m != null && (f.hospital_dist_m ?? Infinity) > max_hospital_dist_m) return false;
    if (max_metro_dist_m != null && (f.metro_dist_m ?? Infinity) > max_metro_dist_m) return false;
    if (max_crime_score != null && (p.crime_score ?? 0) > max_crime_score) return false;

    return true;
  });

  const sorters = {
    ai_rating: (a, b) => (b.ai_rating ?? 0) - (a.ai_rating ?? 0),
    roi_5y_pct: (a, b) => (b.roi_5y_pct ?? 0) - (a.roi_5y_pct ?? 0),
    price_low_to_high: (a, b) => a.price_lakhs - b.price_lakhs,
    price_high_to_low: (a, b) => b.price_lakhs - a.price_lakhs,
    area_sqft: (a, b) => b.area_sqft - a.area_sqft,
    newest: (a, b) => (a.age_years ?? 0) - (b.age_years ?? 0),
  };
  matched.sort(sorters[sort_by] || sorters.ai_rating);

  const capped = Math.min(Number(limit) || MAX_ROWS, MAX_ROWS);
  return {
    total_matches: matched.length,
    returned: Math.min(matched.length, capped),
    properties: matched.slice(0, capped).map((p) => project(p, { withMedia: with_media })),
  };
}

/** Full detail for one listing the model already found via search. */
async function getPropertyDetails(propertyId) {
  const all = await loadAll();
  const found = all.find((p) => p.id === propertyId || String(p._id) === propertyId);
  if (!found) return { found: false, message: `No property with id ${propertyId}` };

  return {
    found: true,
    property: {
      ...project(found, { withMedia: true }),
      address: found.address,
      amenities: found.amenities,
      total_floors: found.total_floors,
      floor: found.floor,
      parking: found.parking,
    },
  };
}

/**
 * City-level aggregates so the model can answer comparison questions
 * ("which city has the best ROI?") without pulling every row.
 */
async function getMarketStats(city) {
  const all = await loadAll();
  const scope = city && city !== 'All'
    ? all.filter((p) => p.city.toLowerCase() === String(city).toLowerCase())
    : all;

  if (scope.length === 0) return { city: city || 'All', listings: 0 };

  const avg = (fn) => scope.reduce((sum, p) => sum + (fn(p) || 0), 0) / scope.length;

  return {
    city: city || 'All India',
    listings: scope.length,
    avg_price_lakhs: Math.round(avg((p) => p.price_lakhs) * 10) / 10,
    min_price_lakhs: Math.min(...scope.map((p) => p.price_lakhs)),
    max_price_lakhs: Math.max(...scope.map((p) => p.price_lakhs)),
    avg_price_per_sqft: Math.round(avg((p) => (p.price_lakhs * 100000) / p.area_sqft)),
    avg_roi_5y_pct: Math.round(avg((p) => p.roi_5y_pct) * 10) / 10,
    avg_crime_score: Math.round(avg((p) => p.crime_score) * 10) / 10,
    localities: [...new Set(scope.map((p) => p.location))],
  };
}

/**
 * Every market the platform can offer, not just the ones with live listings.
 *
 * The catalogue only carries a handful of cities, but CITY_PROFILES prices
 * twenty across India. Returning only the former left the recommendation city
 * picker showing five options on a nationwide platform. Cities with no
 * listings come back with `listings: 0` and `modelled: true` so callers can
 * label them honestly rather than implying inventory that does not exist.
 *
 * Catalogue cities sort first by listing count, then the modelled-only
 * markets alphabetically.
 */
async function listCities() {
  const { listProfileCities } = require('../utils/cityProfiles');

  const all = await loadAll();
  const counts = {};
  for (const p of all) counts[p.city] = (counts[p.city] || 0) + 1;

  const withListings = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, listings]) => ({ city: name, listings, modelled: false }));

  const modelledOnly = listProfileCities()
    .filter((name) => !counts[name])
    .map((name) => ({ city: name, listings: 0, modelled: true }));

  return { cities: [...withListings, ...modelledOnly] };
}

module.exports = { searchProperties, getPropertyDetails, getMarketStats, listCities, MAX_ROWS };
