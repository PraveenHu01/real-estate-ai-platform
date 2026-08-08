// Per-city market assumptions, mirrored from ml-service/predict.py CITY_PROFILES.
//
// This exists so the API is fully self-sufficient on Vercel. The Python ML
// service cannot be deployed there — scikit-learn, pandas and numpy together
// blow past the serverless bundle limit — so these figures back the JS
// fallbacks in aiController when ML_SERVICE_URL is unreachable or unset.
//
// Keep in step with predict.py. If the two drift, a price shown before the ML
// service warms up will not match the one shown after.
//
//   ratePerSqft : typical asking rate in Rs/sqft
//   growth      : annual capital appreciation
//   crime       : 1.0 safest .. 6.0 least safe

const CITY_PROFILES = {
  // Tier 1 — metro
  Mumbai:        { ratePerSqft: 22000, growth: 0.084, crime: 3.0 },
  Delhi:         { ratePerSqft: 14000, growth: 0.077, crime: 3.8 },
  Bengaluru:     { ratePerSqft: 11000, growth: 0.098, crime: 2.3 },
  Hyderabad:     { ratePerSqft:  8000, growth: 0.087, crime: 2.6 },
  Pune:          { ratePerSqft:  8800, growth: 0.080, crime: 2.4 },
  Chennai:       { ratePerSqft:  9500, growth: 0.074, crime: 2.7 },
  Kolkata:       { ratePerSqft:  6500, growth: 0.067, crime: 3.0 },
  // NCR satellites
  Gurgaon:       { ratePerSqft: 12200, growth: 0.081, crime: 3.1 },
  Noida:         { ratePerSqft:  7700, growth: 0.079, crime: 2.9 },
  // Tier 2
  Chandigarh:    { ratePerSqft:  8100, growth: 0.078, crime: 2.2 },
  Kochi:         { ratePerSqft:  7300, growth: 0.076, crime: 2.4 },
  Coimbatore:    { ratePerSqft:  6300, growth: 0.073, crime: 2.3 },
  Ahmedabad:     { ratePerSqft:  6000, growth: 0.077, crime: 2.7 },
  Visakhapatnam: { ratePerSqft:  5900, growth: 0.074, crime: 2.5 },
  Surat:         { ratePerSqft:  5600, growth: 0.075, crime: 2.6 },
  Jaipur:        { ratePerSqft:  5500, growth: 0.073, crime: 2.8 },
  Indore:        { ratePerSqft:  5200, growth: 0.079, crime: 2.9 },
  Lucknow:       { ratePerSqft:  5100, growth: 0.070, crime: 2.9 },
  Nagpur:        { ratePerSqft:  5100, growth: 0.070, crime: 2.6 },
  Bhopal:        { ratePerSqft:  4200, growth: 0.073, crime: 2.6 },
};

// Used for any city not in the table, so an unlisted market still returns a
// plausible number rather than failing.
const DEFAULT_PROFILE = { ratePerSqft: 5000, growth: 0.075, crime: 2.5 };

function cityProfile(city) {
  return CITY_PROFILES[city] || DEFAULT_PROFILE;
}

const round2 = (n) => Math.round(n * 100) / 100;
const round1 = (n) => Math.round(n * 10) / 10;

/** Formula price estimate in lakhs. Mirrors predict.py's fallback branch. */
function estimatePrice({ city, area_sqft, age_years = 2, parking = 1, floor = 3 }) {
  const { ratePerSqft } = cityProfile(city);
  const ageDecay = Math.max(0.65, 1.0 - age_years * 0.015);
  return round2((area_sqft * ratePerSqft * ageDecay) / 100000 + parking * 3.5 + floor * 0.3);
}

/** 1Y/3Y/5Y projection, ROI, risk band and rating. Mirrors predict.py. */
function investmentForecast({ current_price_lakhs, city, age_years = 2 }) {
  let rate = cityProfile(city).growth;
  if (age_years < 5) rate += 0.015;
  else if (age_years > 15) rate -= 0.010;

  const at = (yrs) => round2(current_price_lakhs * Math.pow(1 + rate, yrs));
  const p5 = at(5);
  const roi5 = round1(((p5 - current_price_lakhs) / current_price_lakhs) * 100);

  return {
    current_price_lakhs,
    predicted_price_1y: at(1),
    predicted_price_3y: at(3),
    predicted_price_5y: p5,
    expected_roi_5y_pct: roi5,
    risk_level: age_years > 15 ? 'Moderate' : 'Low',
    annual_cagr_pct: round1(rate * 100),
    ai_rating: round1(Math.min(9.8, Math.max(5.0, 7.0 + roi5 / 15))),
  };
}

module.exports = { CITY_PROFILES, DEFAULT_PROFILE, cityProfile, estimatePrice, investmentForecast };
