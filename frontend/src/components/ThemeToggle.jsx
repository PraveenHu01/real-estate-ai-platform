import React, { useContext } from 'react';
import { ThemeContext, THEMES } from '../context/ThemeContext';
import { Moon, Sparkles } from 'lucide-react';

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme, isBlack } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isBlack ? "Switch to Slate Dark Mode" : "Switch to OLED Black Mode"}
      aria-label={isBlack ? "Switch to Slate Dark Mode" : "Switch to OLED Black Mode"}
      className={`relative inline-flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all duration-200 group ${
        isBlack
          ? 'bg-neutral-900 border-neutral-700 text-white hover:border-neutral-500 shadow-sm'
          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 shadow-sm'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {isBlack ? (
          <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Moon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
        )}
      </div>

      <span className="text-xs font-semibold tracking-wide">
        {isBlack ? 'OLED Black' : 'Slate Dark'}
      </span>

      {/* Mini indicator pill */}
      <span
        className={`w-2 h-2 rounded-full transition-colors ${
          isBlack ? 'bg-purple-500 ring-2 ring-purple-400/30' : 'bg-blue-500 ring-2 ring-blue-400/30'
        }`}
      />
    </button>
  );
}
