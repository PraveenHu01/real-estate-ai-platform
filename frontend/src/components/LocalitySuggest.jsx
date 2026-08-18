import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Check, X } from 'lucide-react';
import api from '../services/api';

const DEFAULT_LOCALITY_MAP = {
  Mumbai: ["Bandra West", "Andheri East", "Powai", "Thane West", "Navi Mumbai", "Worli", "Juhu", "Kandivali West", "Lower Parel"],
  Delhi: ["Dwarka", "Vasant Kunj", "Rohini", "South Extension", "Janakpuri", "Saket", "Greater Kailash", "Pitampura", "Connaught Place"],
  Gurgaon: ["Sector 84 Gurgaon", "Sector 81 Gurgaon", "Sector 66 Gurgaon", "DLF Phase 5", "Golf Course Road", "Cyber City", "Sohna Road"],
  Bengaluru: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Electronic City", "Hebbal", "Sarjapur Road", "Bellandur", "Jayanagar"],
  Hyderabad: ["Gachibowli", "Hitec City", "Madhapur", "Kondapur", "Jubilee Hills", "Banjara Hills", "Nizampet", "Kukatpally", "Nanakramguda"],
  Kolkata: ["New Town", "Salt Lake", "Ballygunge", "Rajarhat", "Alipore", "EM Bypass", "Garia", "Behala", "Howrah"],
  Pune: ["Kothrud", "Baner", "Wakad", "Hinjewadi", "Viman Nagar", "Kharadi", "Aundh", "Hadapsar", "Magarpatta"],
  Noida: ["Sector 62", "Sector 137", "Sector 150", "Sector 75", "Sector 128", "Sector 18", "Greater Noida West"],
  Bhopal: ["MP Nagar", "Arera Colony", "Kolar Road", "Hoshangabad Road", "Bawadiya Kalan", "Chuna Bhatti"],
  Indore: ["Vijay Nagar", "Palasia", "Bypass Road", "Rau", "AB Road", "Mahalaxmi Nagar"],
};

export default function LocalitySuggest({
  city = 'All',
  value = '',
  onChange,
  placeholder = "Select or type available area...",
  className = "",
  placement = "top" // 'top' for opening upward, 'bottom' for downward
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [localities, setLocalities] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Fetch available localities when city changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.get('/properties/localities', { params: { city: city === 'All' ? undefined : city } })
      .then((res) => {
        if (isMounted) {
          const list = res.data.localities || [];
          if (list.length > 0) {
            setLocalities(list);
          } else {
            // Fallback to client map
            const fallbackNames = (city !== 'All' && DEFAULT_LOCALITY_MAP[city]) 
              ? DEFAULT_LOCALITY_MAP[city] 
              : Object.values(DEFAULT_LOCALITY_MAP).flat();
            setLocalities(fallbackNames.map((n) => ({ name: n, count: 0, isLive: false })));
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallbackNames = (city !== 'All' && DEFAULT_LOCALITY_MAP[city]) 
            ? DEFAULT_LOCALITY_MAP[city] 
            : Object.values(DEFAULT_LOCALITY_MAP).flat();
          setLocalities(fallbackNames.map((n) => ({ name: n, count: 0, isLive: false })));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [city]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (locName) => {
    setQuery(locName);
    onChange(locName);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    onChange('');
  };

  // Filter localities based on user typing
  const filtered = localities.filter((loc) =>
    loc.name.toLowerCase().includes(query.toLowerCase().trim())
  );

  const isUpward = placement === 'top';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-14 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition shadow-inner"
        />

        <div className="absolute right-2.5 flex items-center space-x-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-white rounded-md transition"
              title="Clear area"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-white rounded-md transition"
            title="Browse available areas"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${
              isOpen 
                ? (isUpward ? 'rotate-0 text-blue-400' : 'rotate-180 text-blue-400') 
                : (isUpward ? 'rotate-180' : '')
            }`} />
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown - Positioned Upward by default */}
      {isOpen && (
        <div className={`absolute left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 space-y-1 text-xs backdrop-blur-xl ${
          isUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        }`}>
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80">
            <span>Available Areas in {city === 'All' ? 'All India' : city}</span>
            <span className="text-blue-400 font-semibold">{filtered.length} found</span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((loc) => {
              const isSelected = query.toLowerCase() === loc.name.toLowerCase();
              return (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleSelect(loc.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${
                    isSelected
                      ? 'bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/40'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${loc.isLive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{loc.name}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                    {loc.isLive && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {loc.count > 0 ? `${loc.count} listings` : 'Active'}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-center text-slate-400 text-xs">
              No matching area found for "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
