import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const THEMES = {
  DARK: 'dark',
  BLACK: 'black',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('real_estate_theme');
    return saved === THEMES.BLACK ? THEMES.BLACK : THEMES.DARK;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove('theme-dark', 'theme-black', 'theme-white', 'light');
    body.classList.remove('theme-dark', 'theme-black', 'theme-white', 'light');

    // Set new theme attributes and classes
    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);
    root.classList.add('dark');
    body.classList.add('dark');

    if (theme === THEMES.BLACK) {
      root.classList.add('theme-black');
      body.classList.add('theme-black');
    } else {
      root.classList.add('theme-dark');
      body.classList.add('theme-dark');
    }

    localStorage.setItem('real_estate_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === THEMES.DARK ? THEMES.BLACK : THEMES.DARK));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, THEMES, isBlack: theme === THEMES.BLACK }}>
      {children}
    </ThemeContext.Provider>
  );
};
