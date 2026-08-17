import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const THEMES = {
  WHITE: 'white',
  DARK: 'dark',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('real_estate_theme');
    if (saved === 'dark' || saved === 'black') return THEMES.DARK;
    return THEMES.WHITE; // Default clean white theme
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove legacy / previous classes
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

    localStorage.setItem('real_estate_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === THEMES.WHITE ? THEMES.DARK : THEMES.WHITE));
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
