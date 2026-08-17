import React, { createContext, useState, useEffect, useRef } from 'react';

export const ThemeContext = createContext();

export const THEMES = {
  WHITE: 'white',
  DARK: 'dark',
};

const TRANSITION_MS = 240;

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('real_estate_theme');
    if (saved === 'dark' || saved === 'black') return THEMES.DARK;
    return THEMES.WHITE;
  });

  const paintedTheme = useRef(null);
  const transitionTimer = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Apply targeted transition class for non-view-transition fallback
    if (paintedTheme.current !== null && paintedTheme.current !== theme) {
      if (!('startViewTransition' in document)) {
        clearTimeout(transitionTimer.current);
        root.classList.add('theme-transition');
        transitionTimer.current = setTimeout(() => {
          root.classList.remove('theme-transition');
          transitionTimer.current = null;
        }, TRANSITION_MS);
      }
    }
    paintedTheme.current = theme;

    // Clean legacy / previous classes
    root.classList.remove('theme-dark', 'theme-black', 'theme-white', 'light', 'dark');
    body.classList.remove('theme-dark', 'theme-black', 'theme-white', 'light', 'dark');

    // Set new theme attributes and classes
    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    if (theme === THEMES.WHITE) {
      root.classList.add('theme-white', 'light');
      body.classList.add('theme-white', 'light');
    } else {
      root.classList.add('theme-dark', 'dark');
      body.classList.add('theme-dark', 'dark');
    }

    root.style.colorScheme = theme === THEMES.WHITE ? 'light' : 'dark';
    localStorage.setItem('real_estate_theme', theme);
  }, [theme]);

  useEffect(() => () => clearTimeout(transitionTimer.current), []);

  const toggleTheme = () => {
    const nextTheme = theme === THEMES.WHITE ? THEMES.DARK : THEMES.WHITE;

    // Native hardware-accelerated View Transition API for instant, buttery-smooth 60/120fps crossfade
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.startViewTransition(() => {
        setTheme(nextTheme);
      });
    } else {
      setTheme(nextTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      THEMES,
      isWhite: theme === THEMES.WHITE,
      isDark: theme === THEMES.DARK,
      isBlack: theme === THEMES.DARK
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
