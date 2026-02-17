import { createContext, useContext } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemePalette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryAlt: string;
  positive: string;
  border: string;
  accentWarm: string;
  accentCool: string;
  shadow: string;
}

const darkTheme: ThemePalette = {
  bg: '#000000',
  surface: '#101a22',
  surfaceAlt: '#16232d',
  text: '#f2f7fa',
  textMuted: '#92a8b7',
  primary: '#1dd3b0',
  primaryAlt: '#0fa68a',
  positive: '#5fd6a0',
  border: '#28404f',
  accentWarm: '#ff7a59',
  accentCool: '#45b6ff',
  shadow: '#000000',
};

const lightTheme: ThemePalette = {
  bg: '#ffffff',
  surface: '#f2f6fa',
  surfaceAlt: '#e9f0f6',
  text: '#0f1a21',
  textMuted: '#546977',
  primary: '#0c8b74',
  primaryAlt: '#0b6e5d',
  positive: '#208354',
  border: '#c0d1dd',
  accentWarm: '#d85b3b',
  accentCool: '#2688c8',
  shadow: '#000000',
};

const ThemeContext = createContext<{ mode: ThemeMode; theme: ThemePalette }>({
  mode: 'dark',
  theme: darkTheme,
});

// Backward-compatible static export for modules that are still migrating.
export const theme = darkTheme;

export function resolveTheme(mode: ThemeMode): ThemePalette {
  return mode === 'light' ? lightTheme : darkTheme;
}

export function AppThemeProvider({
  mode,
  children,
}: {
  mode: ThemeMode;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={{ mode, theme: resolveTheme(mode) }}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext).theme;
}

export function useThemeMode() {
  return useContext(ThemeContext).mode;
}
