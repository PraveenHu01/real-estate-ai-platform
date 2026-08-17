import React, { useState } from 'react';
import {
  TrendingUp, Cpu, Sparkles, AlertCircle, ArrowRight, ShieldCheck, CheckCircle,
  IndianRupee, Layers, PieChart, Wallet, Compass, Zap
} from 'lucide-react';
import api from '../services/api';

export default function PricePredictorPage() {
  const [city, setCity] = useState('Mumbai');
  const [location, setLocation] = useState('Bandra West');
  const [areaSqft, setAreaSqft] = useState(1200);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [ageYears, setAgeYears] = useState(2);
  const [parking, setParking] = useState(1);
  const [floor, setFloor] = useState(4);
  const [furnished, setFurnished] = useState('Semi-Furnished');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const locationsByCity = {
    Mumbai: ["Bandra West", "Andheri East", "Powai", "Thane West", "Navi Mumbai", "Worli", "Juhu", "Kandivali West"],
    Delhi: ["Dwarka", "Vasant Kunj", "Rohini", "South Extension", "Janakpuri", "Saket", "Greater Kailash", "Pitampura"],
    Gurgaon: ["Sector 84 Gurgaon", "Sector 81 Gurgaon", "Sector 66 Gurgaon", "DLF Phase 5", "Golf Course Road", "Cyber City", "Sohna Road"],
    Bengaluru: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Electronic City", "Hebbal", "Sarjapur Road", "Bellandur"],
    Hyderabad: ["Gachibowli", "Hitec City", "Madhapur", "Kondapur", "Jubilee Hills", "Banjara Hills", "Nizampet", "Kukatpally"],
    Kolkata: ["New Town", "Salt Lake", "Ballygunge", "Rajarhat", "Alipore", "EM Bypass", "Garia", "Behala"],
    Pune: ["Kothrud", "Baner", "Wakad", "Hinjewadi", "Viman Nagar", "Kharadi", "Aundh", "Hadapsar"],
    Noida: ["Sector 62", "Sector 137", "Sector 150", "Sector 75", "Sector 128", "Sector 18"],
    Chennai: ["OMR", "Anna Nagar", "Adyar", "Velachery", "T Nagar", "Besant Nagar", "Sholinganallur"],
    Ahmedabad: ["SG Highway", "Bopal", "Prahlad Nagar", "Bodakdev", "Thaltej", "Satellite", "Vastrapur"],
    Jaipur: ["Vaishali Nagar", "Malviya Nagar", "Mansarovar", "Jagatpura", "C Scheme", "Tonk Road"],
    Lucknow: ["Gomti Nagar", "Indira Nagar", "Aliganj", "Hazratganj", "Vibhuti Khand", "Sushant Golf City"],
    Chandigarh: ["Sector 17", "Sector 35", "Sector 8", "Sector 43", "Sector 22", "Sector 9"],
    Indore: ["Vijay Nagar", "Palasia", "Bypass Road", "Rau", "AB Road", "Mahalaxmi Nagar"],
    Bhopal: ["MP Nagar", "Arera Colony", "Kolar Road", "Hoshangabad Road", "Bawadiya Kalan", "Chuna Bhatti"],
    Kochi: ["Kakkanad", "Edappally", "Marine Drive", "Palarivattom", "Vyttila", "Panampilly Nagar"],
    Coimbatore: ["RS Puram", "Gandhipuram", "Saibaba Colony", "Peelamedu", "Saravanampatti", "Race Course"],
    Nagpur: ["Dharampeth", "Wardha Road", "Manish Nagar", "Ramdaspeth", "Civil Lines", "Besur"],
    Visakhapatnam: ["MVP Colony", "Madhurawada", "Gajuwaka", "Seethammadhara", "Rushikonda", "Yendada"],
    Surat: ["Vesu", "Adajan", "Piplod", "Pal", "Citylight", "Ghod Dod Road"],
    Patna: ["Bailey Road", "Boring Road", "Kankarbagh", "Danapur", "Ashiana Nagar", "Rajendra Nagar"],
    Bhubaneswar: ["Patia", "Chandrasekharpur", "Nayapalli", "Jayadev Vihar", "Khandagiri", "Saheed Nagar"],
    Raipur: ["VIP Road", "Shankar Nagar", "Telibandha", "Devendra Nagar", "Civil Lines", "Tatibandh"],
    Ranchi: ["Kanke Road", "Bariatu", "Harmu", "Doranda", "Lalpur", "Morabadi"],
    Vadodara: ["Alkapuri", "Vasna Road", "Gotri", "Karelibaug", "Akota", "Manjalpur"],
    Kanpur: ["Civil Lines", "Swaroop Nagar", "Kakadeo", "Kalyanpur", "Kidwai Nagar", "Shyam Nagar"],
    Varanasi: ["Sigra", "Lanka", "Shivpur", "Mahmoorganj", "Orderly Bazar", "Cantt"],
    Dehradun: ["Rajpur Road", "Sahastradhara Road", "Vasant Vihar", "Jakhan", "Clement Town", "Ballupur"],
    Thiruvananthapuram: ["Kowdiar", "Pattom", "Kazhakkoottam", "Sasthamangalam", "Vellayambalam", "Technopark"],
    Mysore: ["Gokulam", "Jayalakshmipuram", "Kuvempunagar", "Vijayanagar", "Hebbal", "Bogadi"],
    Guwahati: ["GS Road", "Zoo Road", "Beltola", "Six Mile", "Hatigaon", "Ulubari"],
    Nashik: ["College Road", "Gangapur Road", "Indira Nagar", "Govind Nagar", "Panchavati", "Ashoka Marg"]
  };

  const cityList = Object.keys(locationsByCity).sort();

  const handleCityChange = (newCity) => {
    setCity(newCity);
    setLocation(locationsByCity[newCity] ? locationsByCity[newCity][0] : 'City Centre');
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/ai/predict-price', {
        city,
        location,
        area_sqft: parseFloat(areaSqft),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        age_years: parseInt(ageYears),
        parking: parseInt(parking),
        floor: parseInt(floor),
        furnished
      });
      setResult(res.data);
    } catch (err) {
      console.error('Predict error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest">
          <Cpu className="w-3.5 h-3.5" />
          <span>All-India Random Forest & Real Dataset AI Model</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">AI Property Valuation & Rental Forecaster</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Trained over 54,000+ real and modeled transactions across 32 Indian cities. Includes explainable price attribution, confidence bounds, and passive rental yield estimation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Card */}
        <form onSubmit={handlePredict} className="lg:col-span-5 glass-card p-6 rounded-2xl space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Property Specifications</h3>
            <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">32 Cities</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <label className="block text-slate-400 mb-1">Target City</label>
              <select 
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                {cityList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Locality</label>
              <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                {(locationsByCity[city] || ['City Centre']).map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-medium">
            <div>
              <label className="block text-slate-400 mb-1">Area (sq.ft)</label>
              <input 
                type="number" value={areaSqft} min="200" max="15000"
                onChange={(e) => setAreaSqft(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Bedrooms</label>
              <select 
                value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Bathrooms</label>
              <select 
                value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
              >
                <option value="1">1 Bath</option>
                <option value="2">2 Baths</option>
                <option value="3">3 Baths</option>
                <option value="4">4+ Baths</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-medium">
            <div>
              <label className="block text-slate-400 mb-1">Age (Yrs)</label>
              <input 
                type="number" value={ageYears} min="0" max="40"
                onChange={(e) => setAgeYears(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Parking</label>
              <select 
                value={parking} onChange={(e) => setParking(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
              >
                <option value="0">0 Slots</option>
                <option value="1">1 Slot</option>
                <option value="2">2 Slots</option>
                <option value="3">3+ Slots</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Floor Level</label>
              <input 
                type="number" value={floor} min="0" max="60"
                onChange={(e) => setFloor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
              />
            </div>
          </div>

          <div className="text-xs font-medium">
            <label className="block text-slate-400 mb-1">Furnishing Status</label>
            <select
              value={furnished}
              onChange={(e) => setFurnished(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
            >
              <option value="Unfurnished">Unfurnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Fully-Furnished">Fully-Furnished</option>
            </select>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg glow-emerald transition flex items-center justify-center space-x-2"
          >
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            <span>{loading ? 'Evaluating Model Inferences...' : 'Calculate Predicted Valuation'}</span>
          </button>
        </form>

        {/* Prediction Results Output */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Main Price Card */}
              <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>AI Valuation Model Inference</span>
                  </div>
                  {result.cached && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      ⚡ Instant Cache (&lt;2ms)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Estimated Fair Price</span>
                    <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                      ₹{result.predicted_price_lakhs} <span className="text-base text-emerald-400 font-bold">Lakhs</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium block mt-1">
                      Effective Rate: ₹{result.price_per_sqft} / sq.ft
                    </span>
                  </div>

                  {result.confidence_interval && (
                    <div className="sm:border-l sm:border-slate-800 sm:pl-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Certainty Score:</span>
                        <strong className="text-emerald-400 font-bold">{result.confidence_interval.confidence_score_pct}%</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Fair Market Band:</span>
                        <span className="text-white font-semibold">₹{result.confidence_interval.price_range_lakhs.low}L – ₹{result.confidence_interval.price_range_lakhs.high}L</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Market Momentum:</span>
                        <span className="text-blue-400 font-semibold">{result.confidence_interval.investment_grade}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Explainable Price Attribution Breakdown */}
              {result.price_breakdown && (
                <div className="glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                    <PieChart className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Explainable AI Price Attribution</h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Base Locality Value</span>
                      <strong className="text-white text-sm">₹{result.price_breakdown.base_locality_val_lakhs}L</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Parking Contribution</span>
                      <strong className="text-emerald-400 text-sm">+₹{result.price_breakdown.parking_val_lakhs}L</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Floor Elevation Bonus</span>
                      <strong className="text-emerald-400 text-sm">+{result.price_breakdown.floor_premium_lakhs}L</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Age Depreciation</span>
                      <strong className="text-amber-400 text-sm">{result.price_breakdown.age_depreciation_lakhs}L</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Furnishing Finish</span>
                      <strong className="text-blue-400 text-sm">+₹{result.price_breakdown.furnishing_val_lakhs}L</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Transit & Schools</span>
                      <strong className="text-teal-400 text-sm">+₹{result.price_breakdown.transit_proximity_lakhs}L</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Rental Yield & Passive Income Projections */}
              {result.rental_yield_forecast && (
                <div className="glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Rental Yield & Passive Cash Flow</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Expected Monthly Rent</span>
                      <strong className="text-emerald-400 text-base font-black">
                        ₹{result.rental_yield_forecast.estimated_monthly_rent_rs?.toLocaleString('en-IN')}{' '}
                        <span className="text-xs text-slate-400 font-normal">/mo</span>
                      </strong>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Band: ₹{result.rental_yield_forecast.monthly_rent_range_rs?.low?.toLocaleString('en-IN')} – ₹{result.rental_yield_forecast.monthly_rent_range_rs?.high?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Gross Rental Yield</span>
                      <strong className="text-white text-base font-black">
                        {result.rental_yield_forecast.gross_rental_yield_pct}% <span className="text-xs text-slate-400 font-normal">p.a.</span>
                      </strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{result.rental_yield_forecast.tenant_demand}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Payback Period</span>
                      <strong className="text-blue-400 text-base font-black">
                        {result.rental_yield_forecast.payback_period_years} <span className="text-xs text-slate-400 font-normal">Yrs</span>
                      </strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Rental Breakeven</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5-Year Capital Growth */}
              {result.investment_forecast && (
                <div className="glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">5-Year Capital Appreciation</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs text-center">
                    <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                      <span className="text-slate-400 text-[11px] block">1 Year Target</span>
                      <strong className="text-white text-sm">₹{result.investment_forecast.predicted_price_1y}L</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                      <span className="text-slate-400 text-[11px] block">3 Year Target</span>
                      <strong className="text-white text-sm">₹{result.investment_forecast.predicted_price_3y}L</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                      <span className="text-slate-400 text-[11px] block">5 Year Target</span>
                      <strong className="text-emerald-400 text-sm font-bold">₹{result.investment_forecast.predicted_price_5y}L (+{result.investment_forecast.expected_roi_5y_pct}%)</strong>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center space-y-3">
              <Cpu className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
              <h4 className="text-base font-bold text-white">Ready for Valuation Inference</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select your city and property specifications on the left to generate the complete price breakdown, rental yields, and confidence intervals.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
