import React, { createContext, useState, useLayoutEffect, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

export const ThemeContext = createContext();

export const THEMES = {
  WHITE: 'white',
  DARK: 'dark',
};

// Long enough to outlast the CSS animation in index.css, which is what actually
// times the swap; this only decides when the fallback class comes back off.
const TRANSITION_MS = 260;

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('real_estate_theme');
    if (saved === 'dark' || saved === 'black') return THEMES.DARK;
    return THEMES.WHITE;
  });

  const paintedTheme = useRef(null);
  const transitionTimer = useRef(null);

  // useLayoutEffect, not useEffect: startViewTransition grabs its "after"
  // snapshot as soon as its callback returns, and a passive effect has not run
  // by that point. The class swap has to be in the DOM synchronously or the two
  // snapshots come out identical and the crossfade plays over nothing.
  useLayoutEffect(() => {
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

    if (typeof document === 'undefined' || !('startViewTransition' in document)) {
      setTheme(nextTheme);
      return;
    }

    // Native GPU-accelerated crossfade: the browser snapshots the page before
    // and after, then fades between the two images, so the whole tree moves as
    // one regardless of how many rules the swap repaints.
    document.startViewTransition(() => {
      // flushSync forces the render and the layout effect above to land before
      // the callback returns. A bare setTheme only queues the update — React 18
      // batches it, so it commits after the snapshot and the crossfade animates
      // two identical frames while the real swap snaps in afterwards.
      flushSync(() => setTheme(nextTheme));
    });
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
