import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

interface Theme {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Accent colors
  primary: string;
  secondary: string;
  accent: string;
  warning: string;
  
  // Progress ring colors
  ringGreen: string;
  ringOrange: string;
  ringBlue: string;
  ringRed: string;
  
  // Card
  cardBackground: string;
  cardBorder: string;
  
  // Badge colors
  badgeGold: string;
  badgeSilver: string;
  badgeBronze: string;
  
  // Status
  success: string;
  error: string;
  info: string;

  // Tab bar
  tabBarBackground: string;
  tabBarBorder: string;
  
  // Input
  inputBackground: string;
  inputBorder: string;
}

export const darkTheme: Theme = {
  // Backgrounds
  background: '#000505',
  backgroundSecondary: '#0a0f0f',
  backgroundTertiary: '#151a1a',
  
  // Text
  text: '#FEFCFD',
  textSecondary: '#B8B5B6',
  textTertiary: '#7A7778',
  
  // Accent colors (light colors need dark text on them)
  primary: '#D0EFB1', // Light green for positive/income
  secondary: '#E58C8A', // Light coral for negative/expense
  accent: '#BFCDE0', // Light blue
  warning: '#E58C8A',
  
  // Progress ring colors
  ringGreen: '#D0EFB1',
  ringOrange: '#E58C8A',
  ringBlue: '#BFCDE0',
  ringRed: '#E58C8A',
  
  // Card
  cardBackground: '#0a0f0f',
  cardBorder: '#1f2424',
  
  // Badge colors
  badgeGold: '#FFD700',
  badgeSilver: '#C0C0C0',
  badgeBronze: '#CD7F32',
  
  // Status
  success: '#D0EFB1',
  error: '#E58C8A',
  info: '#BFCDE0',

  // Tab bar
  tabBarBackground: '#0a0f0f',
  tabBarBorder: '#1f2424',
  
  // Input
  inputBackground: '#151a1a',
  inputBorder: '#2a2f2f',
};

export const lightTheme: Theme = {
  // Backgrounds
  background: '#FEFCFD',
  backgroundSecondary: '#F5F3F4',
  backgroundTertiary: '#EBE9EA',
  
  // Text
  text: '#000505',
  textSecondary: '#4A4748',
  textTertiary: '#7A7778',
  
  // Accent colors
  primary: '#9BC57D', // Darker green for better contrast on light background (income/positive)
  secondary: '#D06563', // Darker coral for better contrast (expense/negative)
  accent: '#8FA6C3', // Darker blue for better contrast
  warning: '#D06563',
  
  // Progress ring colors
  ringGreen: '#9BC57D',
  ringOrange: '#D06563',
  ringBlue: '#8FA6C3',
  ringRed: '#D06563',
  
  // Card
  cardBackground: '#F5F3F4',
  cardBorder: '#D4D2D3',
  
  // Badge colors
  badgeGold: '#FFD700',
  badgeSilver: '#C0C0C0',
  badgeBronze: '#CD7F32',
  
  // Status
  success: '#9BC57D',
  error: '#D06563',
  info: '#8FA6C3',

  // Tab bar
  tabBarBackground: '#FEFCFD',
  tabBarBorder: '#D4D2D3',
  
  // Input
  inputBackground: '#EBE9EA',
  inputBorder: '#C4C2C3',
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
