import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // STRICT DEFAULT: 'light' mode. Only 'dark' if user explicitly clicked/chose dark mode.
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('docushield_theme_preference') || localStorage.getItem('theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Apply theme to DOM and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
      localStorage.setItem('docushield_theme_preference', theme);
    } catch (e) {
      console.warn('Error saving theme preference:', e);
    }
  }, [theme]);

  const setThemePreference = useCallback((pref) => {
    const validTheme = pref === 'dark' ? 'dark' : 'light';
    setThemeState(validTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themePreference: theme,
        setThemePreference,
        isDarkMode: theme === 'dark',
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

