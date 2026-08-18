import React from 'react';
import { Building2, Sparkles, Shield, Cpu, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-blue-500/30">
                <img src="/logo.png" alt="InvestAI Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Invest<span className="text-blue-500">AI</span></span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Next-generation AI-powered real estate investment platform delivering machine learning price predictions, 5-year ROI forecasts, crime safety scores, and smart property recommendations across top Indian cities.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">AI Features</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/price-predictor" className="hover:text-blue-400 transition">Random Forest Price Predictor</a></li>
              <li><a href="/investment-analysis" className="hover:text-emerald-400 transition">5-Year CAGR & ROI Forecast</a></li>
              <li><a href="/ai-recommendations" className="hover:text-purple-400 transition">Lifestyle Proximity Matcher</a></li>
              <li><a href="/compare" className="hover:text-blue-400 transition">Side-by-Side Property Comparator</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Supported Cities</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-300 font-medium">Bhopal</span> (MP Nagar, Arera Colony, Kolar)</li>
              <li><span className="text-slate-300 font-medium">Indore</span> (Vijay Nagar, Palasia, AB Road)</li>
              <li><span className="text-slate-300 font-medium">Bengaluru</span> (Indiranagar, Whitefield, HSR)</li>
              <li><span className="text-slate-300 font-medium">Mumbai</span> (Bandra West, Powai, Andheri)</li>
              <li><span className="text-slate-300 font-medium">Delhi</span> (Dwarka, Vasant Kunj, Rohini)</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-900 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 InvestAI Real Estate Platform. Developed for Academic & Industry Excellence.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span className="flex items-center space-x-1 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span>Random Forest ML Active</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
