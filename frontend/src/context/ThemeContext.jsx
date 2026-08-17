import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const THEMES = {
  DARK: 'dark',
  BLACK: 'black',
  WHITE: 'white',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('real_estate_theme') || THEMES.DARK;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove('theme-dark', 'theme-black', 'theme-white', 'dark', 'light');
    body.classList.remove('theme-dark', 'theme-black', 'theme-white', 'dark', 'light');

    // Set new theme attributes and classes
    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    if (theme === THEMES.WHITE) {
      root.classList.add('theme-white', 'light');
      body.classList.add('theme-white', 'light');
    } else if (theme === THEMES.BLACK) {
      root.classList.add('theme-black', 'dark');
      body.classList.add('theme-black', 'dark');
    } else {
      root.classList.add('theme-dark', 'dark');
      body.classList.add('theme-dark', 'dark');
    }

    localStorage.setItem('real_estate_theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === THEMES.DARK) setTheme(THEMES.BLACK);
    else if (theme === THEMES.BLACK) setTheme(THEMES.WHITE);
    else setTheme(THEMES.DARK);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};
