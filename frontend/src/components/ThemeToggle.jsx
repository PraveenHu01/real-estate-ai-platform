import React, { useContext } from 'react';
import { ThemeContext, THEMES } from '../context/ThemeContext';
import { Moon, Circle, Sun } from 'lucide-react';

export default function ThemeToggle({ className = "" }) {
  const { theme, setTheme, cycleTheme } = useContext(ThemeContext);

  const options = [
    { id: THEMES.DARK, label: 'Dark', icon: Moon, desc: 'Slate Blue Dark' },
    { id: THEMES.BLACK, label: 'Black', icon: Circle, desc: 'OLED Pitch Black' },
    { id: THEMES.WHITE, label: 'White', icon: Sun, desc: 'Crisp Clean Light' },
  ];

  return (
    <div className={`inline-flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 theme-toggle-container ${className}`}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            title={`Switch to ${opt.label} Mode (${opt.desc})`}
            aria-label={`Switch to ${opt.label} Mode`}
            aria-pressed={isActive}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${opt.id === THEMES.BLACK ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
