import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import {
  Building2, Sparkles, TrendingUp, Calculator, Bookmark, MessageSquare,
  ShieldCheck, BarChart3, PlusCircle, LogIn, LogOut, User, Menu, X
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { wishlistIds } = useContext(WishlistContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform border border-blue-500/30">
              <img src="/logo.png" alt="InvestAI Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent tracking-tight">
                Invest<span className="text-blue-500">AI</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                Real Estate Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link to="/properties" className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Properties
            </Link>
            <Link to="/ai-recommendations" className="px-3.5 py-2 rounded-lg text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 flex items-center space-x-1.5 transition">
              <Sparkles className="w-4 h-4" />
              <span>AI Recommend</span>
            </Link>
            <Link to="/price-predictor" className="px-3.5 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 flex items-center space-x-1.5 transition">
              <TrendingUp className="w-4 h-4" />
              <span>Price Predictor</span>
            </Link>
            <Link to="/investment-analysis" className="px-3.5 py-2 rounded-lg text-sm font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-950/40 transition">
              ROI Forecast
            </Link>
            <Link to="/compare" className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Compare
            </Link>
            <Link to="/emi-calculator" className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center space-x-1 transition">
              <Calculator className="w-4 h-4 text-slate-400" />
              <span>EMI</span>
            </Link>
            <Link to="/analytics" className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center space-x-1 transition">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Analytics</span>
            </Link>
          </nav>

          {/* Action Buttons, Theme Switcher & Auth */}
          <div className="hidden lg:flex items-center space-x-3">
            <ThemeToggle />

            <Link to="/wishlist" title="Saved properties" aria-label="Saved properties" className="relative p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-blue-400 transition">
              <Bookmark className={`w-5 h-5 ${wishlistIds.length > 0 ? 'fill-current text-blue-400' : ''}`} />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <Link to="/chat" className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-blue-400 transition">
              <MessageSquare className="w-5 h-5" />
            </Link>

            {(user?.role === 'Seller' || user?.role === 'Admin') && (
              <Link to="/add-property" className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold flex items-center space-x-2 shadow-lg glow-blue transition">
                <PlusCircle className="w-4 h-4" />
                <span>List Property</span>
              </Link>
            )}

            {user?.role === 'Admin' && (
              <Link to="/admin" className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-sm font-semibold flex items-center space-x-1.5 transition">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-blue-400">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-semibold text-white leading-tight">{user.name}</span>
                    <span className="block text-[10px] text-blue-400 font-medium leading-tight">{user.role}</span>
                  </div>
                </div>
                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 transition" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
                <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-300 hover:text-white">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden glass-card border-t border-slate-800 px-4 pt-3 pb-6 space-y-2">
          <div className="py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Theme Appearance</span>
            <ThemeToggle />
          </div>
          <Link to="/properties" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-200">Properties</Link>
          <Link to="/ai-recommendations" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-blue-400">AI Recommendation</Link>
          <Link to="/price-predictor" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-emerald-400">Price Predictor ML</Link>
          <Link to="/investment-analysis" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-violet-400">ROI Forecast</Link>
          <Link to="/compare" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-200">Property Comparison</Link>
          <Link to="/emi-calculator" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-200">EMI Calculator</Link>
          <Link to="/analytics" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-200">Analytics Dashboard</Link>
          <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-blue-400">Wishlist ({wishlistIds.length})</Link>
          <Link to="/chat" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-200">Chat Messaging</Link>
          {user?.role === 'Admin' && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-amber-400">Admin Panel</Link>
          )}
          {(user?.role === 'Seller' || user?.role === 'Admin') && (
            <Link to="/add-property" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-semibold text-blue-400">+ List Property</Link>
          )}
          {user ? (
            <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full text-left py-2.5 text-sm font-medium text-red-400">Logout ({user.name})</button>
          ) : (
            <div className="pt-2 border-t border-slate-800 flex space-x-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="w-1/2 text-center py-2 bg-slate-800 rounded-lg text-sm font-medium">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="w-1/2 text-center py-2 bg-blue-600 rounded-lg text-sm font-medium">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
