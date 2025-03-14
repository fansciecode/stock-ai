import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

// Default theme settings
const defaultThemeSettings = {
    mode: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    fontSize: 'medium',
    spacing: 8,
    borderRadius: 4,
    density: 'comfortable',
    animations: true,
    fontFamily: 'Roboto, sans-serif'
};

// Create Theme Context
const ThemeContext = createContext({
    themeSettings: defaultThemeSettings,
    updateTheme: () => {},
    resetTheme: () => {},
    toggleMode: () => {}
});

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
    const [themeSettings, setThemeSettings] = useState(() => {
        const stored = localStorage.getItem('theme_settings');
        return stored ? JSON.parse(stored) : defaultThemeSettings;
    });

    // Generate MUI theme based on settings
    const theme = createTheme({
        palette: {
            mode: themeSettings.mode,
            primary: {
                main: themeSettings.primaryColor
            },
            secondary: {
                main: themeSettings.secondaryColor
            }
        },
        typography: {
            fontFamily: themeSettings.fontFamily,
            fontSize: {
                small: 12,
                medium: 14,
                large: 16
            }[themeSettings.fontSize]
        },
        shape: {
            borderRadius: themeSettings.borderRadius
        },
        spacing: themeSettings.spacing,
        components: {
            MuiButton: {
                defaultProps: {
                    size: themeSettings.density === 'comfortable' ? 'medium' : 'small'
                }
            },
            MuiTextField: {
                defaultProps: {
                    size: themeSettings.density === 'comfortable' ? 'medium' : 'small'
                }
            },
            MuiTableCell: {
                defaultProps: {
                    size: themeSettings.density === 'comfortable' ? 'medium' : 'small'
                }
            }
        },
        transitions: {
            create: (...props) => {
                if (!themeSettings.animations) {
                    return 'none';
                }
                return createTheme().transitions.create(...props);
            }
        }
    });

    // Update theme settings
    const updateTheme = useCallback((updates) => {
        setThemeSettings(prev => {
            const newSettings = { ...prev, ...updates };
            localStorage.setItem('theme_settings', JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);

    // Reset theme to defaults
    const resetTheme = useCallback(() => {
        localStorage.removeItem('theme_settings');
        setThemeSettings(defaultThemeSettings);
    }, []);

    // Toggle between light and dark mode
    const toggleMode = useCallback(() => {
        updateTheme({ mode: themeSettings.mode === 'light' ? 'dark' : 'light' });
    }, [themeSettings.mode, updateTheme]);

    // Initialize theme from system preferences
    useEffect(() => {
        if (!localStorage.getItem('theme_settings')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            updateTheme({ mode: prefersDark ? 'dark' : 'light' });
        }
    }, [updateTheme]);

    const value = {
        themeSettings,
        updateTheme,
        resetTheme,
        toggleMode
    };

    return (
        <ThemeContext.Provider value={value}>
            <MuiThemeProvider theme={theme}>
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

// Custom hook to use theme
const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Theme presets
export const THEME_PRESETS = {
    LIGHT: {
        mode: 'light',
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e'
    },
    DARK: {
        mode: 'dark',
        primaryColor: '#90caf9',
        secondaryColor: '#f48fb1'
    },
    HIGH_CONTRAST: {
        mode: 'dark',
        primaryColor: '#ffffff',
        secondaryColor: '#ffff00',
        fontSize: 'large'
    },
    COMPACT: {
        density: 'compact',
        spacing: 4,
        borderRadius: 2
    },
    COMFORTABLE: {
        density: 'comfortable',
        spacing: 8,
        borderRadius: 4
    },
    PERFORMANCE: {
        animations: false
    }
};

// Font size options
export const FONT_SIZES = ['small', 'medium', 'large'];

// Density options
export const DENSITY_OPTIONS = ['compact', 'comfortable'];

export default useTheme; 