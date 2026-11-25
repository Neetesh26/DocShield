import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // themePreference: 'light' | 'dark' | 'system'
  const [themePreference, setThemePreferenceState] = useState(() => {
    try {
      const saved = localStorage.getItem('docushield_theme_preference');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
      return 'system';
    } catch {
      return 'system';
    }
  });

  // Calculate actual applied theme ('light' or 'dark')
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  const [actualTheme, setActualTheme] = useState(() => {
    if (themePreference === 'system') return getSystemTheme();
    return themePreference;
  });

  // Update DOM when actualTheme changes
  useEffect(() => {
    const root = document.documentElement;
    if (actualTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', actualTheme);
      localStorage.setItem('docushield_theme_preference', themePreference);
    } catch (e) {
      console.warn(e);
    }
  }, [actualTheme, themePreference]);

  // Handle system color scheme change dynamically
  useEffect(() => {
    if (themePreference !== 'system') {
      setActualTheme(themePreference);
      return;
    }

    setActualTheme(getSystemTheme());

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        if (themePreference === 'system') {
          setActualTheme(e.matches ? 'dark' : 'light');
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [themePreference]);

  const setThemePreference = useCallback((pref) => {
    if (pref !== 'light' && pref !== 'dark' && pref !== 'system') return;
    setThemePreferenceState(pref);
    if (pref === 'system') {
      setActualTheme(getSystemTheme());
    } else {
      setActualTheme(pref);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference(actualTheme === 'dark' ? 'light' : 'dark');
  }, [actualTheme, setThemePreference]);

  return (
    <ThemeContext.Provider
      value={{
        theme: actualTheme,
        themePreference,
        setThemePreference,
        isDarkMode: actualTheme === 'dark',
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
