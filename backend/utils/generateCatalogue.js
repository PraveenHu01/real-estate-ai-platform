// Deterministic property catalogue generator.
//
// The 41 hand-written listings in seedData.js cover only 5 cities. This module
// extends coverage to every city the ML service models, so the AI's search
// tools can actually answer "3BHK in Pune" instead of returning nothing.
//
// Generation is SEEDED, not random: the same seed always yields the same
// catalogue. Property ids must stay stable across restarts because wishlists,
// chat threads, and shared links reference them.

// ---------------------------------------------------------------------------
// Market data. rate_per_sqft / growth / crime mirror CITY_PROFILES in
// ml-service/predict.py — keep the two in step or generated prices will
// disagree with the price model's own predictions.
// ---------------------------------------------------------------------------
const CITIES = {
  Mumbai: {
    rate: 22000, growth: 0.084, crime: 3.0, state: 'MH', lat: 19.0760, lng: 72.8777,
    localities: ['Bandra West', 'Andheri East', 'Powai', 'Thane', 'Navi Mumbai', 'Worli', 'Juhu', 'Goregaon', 'Malad West', 'Borivali'],
  },
  Delhi: {
    rate: 14000, growth: 0.077, crime: 3.8, state: 'DL', lat: 28.6139, lng: 77.2090,
    localities: ['Dwarka', 'Vasant Kunj', 'Rohini', 'South Extension', 'Janakpuri', 'Saket', 'Greater Kailash', 'Mayur Vihar', 'Lajpat Nagar', 'Nehru Place'],
  },
  Bengaluru: {
    rate: 11000, growth: 0.098, crime: 2.3, state: 'KA', lat: 12.9716, lng: 77.5946,
    localities: ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Electronic City', 'Yelahanka', 'Marathahalli', 'BTM Layout', 'JP Nagar', 'Bellandur'],
  },
  Hyderabad: {
    rate: 8000, growth: 0.087, crime: 2.6, state: 'TS', lat: 17.3850, lng: 78.4867,
    localities: ['Gachibowli', 'Hitech City', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kondapur', 'Kukatpally', 'Miyapur', 'Shamshabad', 'Secunderabad'],
  },
  Pune: {
    rate: 8800, growth: 0.080, crime: 2.4, state: 'MH', lat: 18.5204, lng: 73.8567,
    localities: ['Hinjewadi', 'Wakad', 'Baner', 'Kharadi', 'Viman Nagar', 'Magarpatta', 'Hadapsar', 'Aundh', 'Koregaon Park', 'Pimpri Chinchwad'],
  },
  Chennai: {
    rate: 9500, growth: 0.074, crime: 2.7, state: 'TN', lat: 13.0827, lng: 80.2707,
    localities: ['OMR', 'Velachery', 'Adyar', 'Anna Nagar', 'T Nagar', 'Porur', 'Thoraipakkam', 'Tambaram', 'Nungambakkam', 'Sholinganallur'],
  },
  Kolkata: {
    rate: 6500, growth: 0.067, crime: 3.0, state: 'WB', lat: 22.5726, lng: 88.3639,
    localities: ['Salt Lake', 'New Town', 'Rajarhat', 'Ballygunge', 'Park Street', 'Alipore', 'Behala', 'Jadavpur', 'Howrah', 'Dum Dum'],
  },
  Gurgaon: {
    rate: 12200, growth: 0.081, crime: 3.1, state: 'HR', lat: 28.4595, lng: 77.0266,
    localities: ['DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'Sohna Road', 'Golf Course Road', 'MG Road', 'Sector 56', 'Sector 43', 'Cyber City', 'New Gurgaon'],
  },
  Noida: {
    rate: 7700, growth: 0.079, crime: 2.9, state: 'UP', lat: 28.5355, lng: 77.3910,
    localities: ['Sector 62', 'Sector 76', 'Sector 137', 'Greater Noida', 'Sector 18', 'Sector 52', 'Noida Extension', 'Sector 78', 'Sector 128', 'Sector 150'],
  },
  Chandigarh: {
    rate: 8100, growth: 0.078, crime: 2.2, state: 'CH', lat: 30.7333, lng: 76.7794,
    localities: ['Sector 17', 'Sector 22', 'Sector 35', 'Sector 43', 'Sector 8', 'Mohali', 'Panchkula', 'Zirakpur', 'Sector 34', 'Sector 11'],
  },
  Kochi: {
    rate: 7300, growth: 0.076, crime: 2.4, state: 'KL', lat: 9.9312, lng: 76.2673,
    localities: ['Kakkanad', 'Edappally', 'Panampilly Nagar', 'Vyttila', 'Marine Drive', 'Kaloor', 'Palarivattom', 'Aluva', 'Ernakulam', 'Fort Kochi'],
  },
  Coimbatore: {
    rate: 6300, growth: 0.073, crime: 2.3, state: 'TN', lat: 11.0168, lng: 76.9558,
    localities: ['RS Puram', 'Saibaba Colony', 'Peelamedu', 'Gandhipuram', 'Singanallur', 'Saravanampatti', 'Vadavalli', 'Thudiyalur', 'Race Course', 'Kalapatti'],
  },
  Ahmedabad: {
    rate: 6000, growth: 0.077, crime: 2.7, state: 'GJ', lat: 23.0225, lng: 72.5714,
    localities: ['SG Highway', 'Vastrapur', 'Bodakdev', 'Satellite', 'Maninagar', 'Thaltej', 'Chandkheda', 'Gota', 'Bopal', 'Prahlad Nagar'],
  },
  Visakhapatnam: {
    rate: 5900, growth: 0.074, crime: 2.5, state: 'AP', lat: 17.6868, lng: 83.2185,
    localities: ['Madhurawada', 'Gajuwaka', 'MVP Colony', 'Dwaraka Nagar', 'Siripuram', 'Rushikonda', 'Yendada', 'Asilmetta', 'Lawsons Bay', 'NAD'],
  },
  Surat: {
    rate: 5600, growth: 0.075, crime: 2.6, state: 'GJ', lat: 21.1702, lng: 72.8311,
    localities: ['Vesu', 'Adajan', 'Pal', 'Althan', 'Ghod Dod Road', 'Citylight', 'Piplod', 'Udhna', 'Magdalla', 'Parle Point'],
  },
  Jaipur: {
    rate: 5500, growth: 0.073, crime: 2.8, state: 'RJ', lat: 26.9124, lng: 75.7873,
    localities: ['Mansarovar', 'Vaishali Nagar', 'Malviya Nagar', 'Jagatpura', 'Raja Park', 'Tonk Road', 'Ajmer Road', 'Sitapura', 'Mahesh Nagar', 'Nirman Nagar'],
  },
  Indore: {
    rate: 5200, growth: 0.079, crime: 2.9, state: 'MP', lat: 22.7196, lng: 75.8577,
    localities: ['Vijay Nagar', 'Palasia', 'Bypass Road', 'Rau', 'AB Road', 'Mahalaxmi Nagar', 'Super Corridor', 'Scheme 54', 'Rajendra Nagar', 'MR 10'],
  },
  Lucknow: {
    rate: 5100, growth: 0.070, crime: 2.9, state: 'UP', lat: 26.8467, lng: 80.9462,
    localities: ['Gomti Nagar', 'Hazratganj', 'Indira Nagar', 'Alambagh', 'Aliganj', 'Mahanagar', 'Rajajipuram', 'Chinhat', 'Jankipuram', 'Ashiyana'],
  },
  Nagpur: {
    rate: 5100, growth: 0.070, crime: 2.6, state: 'MH', lat: 21.1458, lng: 79.0882,
    localities: ['Dharampeth', 'Sadar', 'Civil Lines', 'Ramdaspeth', 'Sitabuldi', 'Wardha Road', 'Hingna', 'Kamptee Road', 'Manish Nagar', 'Laxmi Nagar'],
  },
  Bhopal: {
    rate: 4200, growth: 0.073, crime: 2.6, state: 'MP', lat: 23.2599, lng: 77.4126,
    localities: ['MP Nagar', 'Arera Colony', 'Kolar Road', 'Hoshangabad Road', 'Bawadiya Kalan', 'Ayodhya Bypass', 'Shahpura', 'New Market', 'Bairagarh', 'TT Nagar'],
  },
};

const IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1536376072261-38c91010655c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
];

const BASE_AMENITIES = ['Elevator', 'Security Guard', 'Power Backup', 'Covered Parking', 'Water Supply', 'Intercom'];
const MID_AMENITIES = ['Gym', 'Children Play Area', 'Clubhouse', 'Landscaped Garden', 'CCTV Security', 'Jogging Track'];
const LUXE_AMENITIES = ['Swimming Pool', 'Sky Lounge', 'Concierge', 'EV Charger', 'Home Automation', 'Spa', 'Private Terrace', 'Infinity Pool'];

const DOCUMENTS = ['Sale_Deed.pdf', 'RERA_Approval.pdf', 'Ownership_Deed.pdf', 'Property_Tax_Receipt.pdf', 'Occupancy_Certificate.pdf', 'NOC_Municipal.pdf'];

// Sellers are synthetic. Phone numbers use the 99900 xxxxx block reserved for
// documentation so no generated listing points at a real person.
const SELLER_NAMES = [
  'Rajesh Sharma', 'Priya Nair', 'Amitabh Jain', 'Sneha Kulkarni', 'Arjun Malhotra',
  'Meera Kapoor', 'Vikram Rao', 'Neha Agrawal', 'Karan Mehta', 'Anita Chouhan',
  'Suresh Reddy', 'Divya Menon', 'Rohit Bansal', 'Kavita Iyer', 'Manish Gupta',
];

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32). Deterministic so ids never shift between runs.
// ---------------------------------------------------------------------------
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const between = (rng, lo, hi) => lo + rng() * (hi - lo);
const intBetween = (rng, lo, hi) => Math.floor(between(rng, lo, hi + 1));
const round1 = (n) => Math.round(n * 10) / 10;

/** Weighted BHK mix — 2BHK is the bulk of the Indian market. */
function pickBedrooms(rng) {
  const r = rng();
  if (r < 0.14) return 1;
  if (r < 0.55) return 2;
  if (r < 0.86) return 3;
  if (r < 0.97) return 4;
  return 5;
}

function amenitiesFor(rng, tier) {
  const out = new Set();
  const nBase = intBetween(rng, 2, 4);
  for (let i = 0; i < nBase; i++) out.add(pick(rng, BASE_AMENITIES));
  if (tier >= 1) {
    const n = intBetween(rng, 1, 3);
    for (let i = 0; i < n; i++) out.add(pick(rng, MID_AMENITIES));
  }
  if (tier >= 2) {
    const n = intBetween(rng, 1, 3);
    for (let i = 0; i < n; i++) out.add(pick(rng, LUXE_AMENITIES));
  }
  return [...out];
}

function titleFor(rng, bedrooms, locality, tier) {
  const prefix = tier >= 2
    ? pick(rng, ['Luxury', 'Premium', 'Ultra Modern', 'Signature', 'Elite'])
    : tier === 1
      ? pick(rng, ['Modern', 'Spacious', 'Elegant', 'Smart', 'High-Rise'])
      : pick(rng, ['Budget', 'Compact', 'Affordable', 'Practical', 'Starter']);
  const kind = bedrooms >= 4
    ? pick(rng, ['Villa', 'Penthouse', 'Duplex'])
    : pick(rng, ['Apartment', 'Flat', 'Residence', 'Home']);
  return `${prefix} ${bedrooms}BHK ${kind} in ${locality}`;
}

function descriptionFor(bedrooms, locality, city, tier) {
  const tone = tier >= 2
    ? 'Premium fittings, generous layouts, and a sought-after address'
    : tier === 1
      ? 'Well-planned layout with good natural light and solid connectivity'
      : 'Practical, value-priced home with the essentials covered';
  return `${bedrooms}BHK in ${locality}, ${city}. ${tone}. Close to schools, hospitals, and daily-needs retail, with straightforward access to the city's main transit corridors.`;
}

/**
 * Build the generated portion of the catalogue.
 *
 * @param {number} perCity  listings generated per city
 * @param {number} seed     PRNG seed; same seed = same catalogue
 * @param {number} startIdx numeric offset for ids, to avoid colliding with the
 *                          hand-written prop-101..prop-141 range
 */
function generateCatalogue({ perCity = 18, seed = 20260806, startIdx = 200 } = {}) {
  const rng = makeRng(seed);
  const out = [];
  let idx = startIdx;

  for (const [city, info] of Object.entries(CITIES)) {
    for (let i = 0; i < perCity; i++) {
      const locality = info.localities[i % info.localities.length];

      const bedrooms = pickBedrooms(rng);
      const bathrooms = Math.max(1, bedrooms - (rng() < 0.45 ? 1 : 0));
      const area_sqft = Math.round(bedrooms * between(rng, 380, 640) + between(rng, 60, 190));
      const age_years = intBetween(rng, 0, 22);
      const parking = rng() < 0.2 ? 0 : rng() < 0.78 ? 1 : 2;
      const total_floors = intBetween(rng, 3, 26);
      const floor = intBetween(rng, 1, total_floors);
      const furnishedIdx = intBetween(rng, 0, 2);
      const furnished = ['Unfurnished', 'Semi-Furnished', 'Fully-Furnished'][furnishedIdx];

      // Locality premium: earlier entries in each list are the pricier pockets.
      const localityFactor = 1.18 - (i % info.localities.length) * 0.035;
      const ratePerSqft = info.rate * localityFactor * between(rng, 0.86, 1.14);

      const ageFactor = Math.max(0.65, 1.0 - age_years * 0.015);
      const furnishedFactor = 1.0 + furnishedIdx * 0.06;

      const school_dist_m = intBetween(rng, 200, 3200);
      const hospital_dist_m = intBetween(rng, 250, 4200);
      const metro_dist_m = intBetween(rng, 300, 5800);
      const mall_dist_m = intBetween(rng, 300, 4000);
      const restaurant_dist_m = intBetween(rng, 100, 1400);

      const proximityBonus =
        Math.max(0, (3000 - metro_dist_m) / 1000) * 2.0 +
        Math.max(0, (2000 - school_dist_m) / 1000) * 1.5;

      let price_lakhs =
        (area_sqft * ratePerSqft * ageFactor * furnishedFactor) / 100000 +
        parking * 3.5 +
        (floor > 3 ? floor * 0.4 : 0) +
        proximityBonus;
      price_lakhs = round1(price_lakhs * between(rng, 0.96, 1.04));

      // Growth tracks the city band, nudged by age and metro proximity.
      let growth = info.growth;
      if (age_years < 5) growth += 0.012;
      else if (age_years > 15) growth -= 0.009;
      if (metro_dist_m < 1000) growth += 0.006;
      growth = Math.max(0.045, Math.min(0.125, growth));

      const predicted_price_5y = round1(price_lakhs * Math.pow(1 + growth, 5));
      const roi_5y_pct = round1(((predicted_price_5y - price_lakhs) / price_lakhs) * 100);

      const crime_score = round1(
        Math.max(1.0, Math.min(6.0, info.crime + between(rng, -0.8, 0.8)))
      );

      // Rating blends return, safety, and how new the build is.
      const ai_rating = round1(
        Math.max(5.0, Math.min(9.8,
          6.2 + roi_5y_pct / 22 + (3.5 - crime_score) * 0.35 + (age_years < 5 ? 0.5 : 0)
        ))
      );

      const tier = price_lakhs > info.rate * 0.018 ? 2 : price_lakhs > info.rate * 0.009 ? 1 : 0;
      const sellerName = pick(rng, SELLER_NAMES);
      const sellerSlug = sellerName.split(' ')[0].toLowerCase();

      const nDocs = intBetween(rng, 1, 3);
      const documents = [...new Set(Array.from({ length: nDocs }, () => pick(rng, DOCUMENTS)))];

      const nImages = intBetween(rng, 1, 3);
      const images = [...new Set(Array.from({ length: nImages }, () => pick(rng, IMAGES)))];

      idx += 1;
      out.push({
        id: `prop-${idx}`,
        _id: `6500000000000000000${String(idx).padStart(5, '0')}`,
        title: titleFor(rng, bedrooms, locality, tier),
        description: descriptionFor(bedrooms, locality, city, tier),
        city,
        location: locality,
        address: `${locality}, ${city}, ${info.state}`,
        // Offset from the city centre so map pins spread out plausibly.
        lat: Math.round((info.lat + between(rng, -0.075, 0.075)) * 10000) / 10000,
        lng: Math.round((info.lng + between(rng, -0.075, 0.075)) * 10000) / 10000,
        price_lakhs,
        area_sqft,
        bedrooms,
        bathrooms,
        age_years,
        parking,
        floor,
        total_floors,
        furnished,
        images,
        documents,
        amenities: amenitiesFor(rng, tier),
        seller: {
          name: sellerName,
          email: `${sellerSlug}@${city.toLowerCase()}realty.example`,
          phone: `+91 99900 ${String(10000 + (idx % 89999)).slice(0, 5)}`,
          userId: `seller-gen-${(idx % 15) + 1}`,
        },
        status: 'Approved',
        isFeatured: ai_rating >= 9.2 && rng() < 0.35,
        predicted_price_5y,
        roi_5y_pct,
        ai_rating,
        crime_score,
        nearby_facilities: {
          school_dist_m,
          hospital_dist_m,
          metro_dist_m,
          mall_dist_m,
          restaurant_dist_m,
        },
      });
    }
  }

  return out;
}

module.exports = { generateCatalogue, CITIES };
