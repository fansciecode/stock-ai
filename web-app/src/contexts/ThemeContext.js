import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#1890ff');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedPrimaryColor = localStorage.getItem('primaryColor');

    if (savedTheme) {
      setTheme(savedTheme);
      setIsDarkMode(savedTheme === 'dark');
    }

    if (savedPrimaryColor) {
      setPrimaryColor(savedPrimaryColor);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // Update CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);

    if (isDarkMode) {
      root.style.setProperty('--bg-color', '#1f1f1f');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--card-bg', '#2d2d2d');
      root.style.setProperty('--border-color', '#404040');
    } else {
      root.style.setProperty('--bg-color', '#ffffff');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--border-color', '#d9d9d9');
    }
  }, [theme, primaryColor, isDarkMode]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDarkMode(newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const updatePrimaryColor = (color) => {
    setPrimaryColor(color);
    localStorage.setItem('primaryColor', color);
  };

  const resetTheme = () => {
    setTheme('light');
    setPrimaryColor('#1890ff');
    setIsDarkMode(false);
    localStorage.removeItem('theme');
    localStorage.removeItem('primaryColor');
  };

  const getThemeConfig = () => {
    return {
      token: {
        colorPrimary: primaryColor,
        colorBgBase: isDarkMode ? '#1f1f1f' : '#ffffff',
        colorTextBase: isDarkMode ? '#ffffff' : '#000000',
        colorBgContainer: isDarkMode ? '#2d2d2d' : '#ffffff',
        colorBorder: isDarkMode ? '#404040' : '#d9d9d9',
        colorBgLayout: isDarkMode ? '#141414' : '#f5f5f5',
      },
      algorithm: isDarkMode ? 'dark' : 'default',
    };
  };

  const value = {
    theme,
    primaryColor,
    isDarkMode,
    toggleTheme,
    updatePrimaryColor,
    resetTheme,
    getThemeConfig,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
