import { Dimensions, Platform } from 'react-native';

// Detect phone width at import time for StyleSheet static values
// (useResponsive is for component-level dynamic scaling)
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL = SCREEN_WIDTH < 360; // iPhone SE 1st gen (320px), SE 2nd gen (375px)

// Tighten spacing by ~20% on very small screens
const sp = (base: number) => IS_SMALL ? Math.round(base * 0.82) : base;

export const theme = {
  colors: {
    background: '#F4F7FB',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    textPrimary: '#1E3248',
    textSecondary: '#4B647C',
    textMuted: '#7A8FA3',
    border: '#DAE4EF',
    primary: '#2E7D32',
    primarySoft: '#A5D6A7',
    primaryContrast: '#FFFFFF',
    success: '#1E7A4B',
    warning: '#B7791F',
    danger: '#C53030',
    info: '#2F855A',
    chipBg: '#EAF6EE',
    accentDark: '#16324A',
  },
  spacing: {
    xs: sp(8),
    sm: sp(12),
    md: sp(16),
    lg: sp(20),
    xl: sp(28),
    xxl: sp(36),
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    full: 999,
  },
  typography: {
    h1: { fontSize: IS_SMALL ? 28 : 32, fontWeight: '700' as const, fontFamily: 'Poppins-Regular', lineHeight: IS_SMALL ? 34 : 40 },
    h2: { fontSize: IS_SMALL ? 18 : 21, fontWeight: '700' as const, fontFamily: 'Poppins-Regular', lineHeight: IS_SMALL ? 24 : 28 },
    h3: { fontSize: IS_SMALL ? 15 : 16, fontWeight: '600' as const, fontFamily: 'Poppins-Regular', lineHeight: IS_SMALL ? 20 : 22 },
    body: { fontSize: IS_SMALL ? 13 : 14, fontWeight: '400' as const, fontFamily: 'Poppins-Regular', lineHeight: IS_SMALL ? 18 : 20 },
    bodyStrong: { fontSize: IS_SMALL ? 13 : 14, fontWeight: '600' as const, fontFamily: 'Poppins-Regular', lineHeight: IS_SMALL ? 18 : 20 },
    caption: { fontSize: IS_SMALL ? 11 : 12, fontWeight: '500' as const, fontFamily: 'Poppins-Regular', lineHeight: IS_SMALL ? 15 : 16 },
  },
  shadow: {
    card: Platform.select({
      ios: {
        shadowColor: '#1E3248',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
      default: {
        shadowColor: '#1E3248',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 3,
      },
    })!,
    soft: Platform.select({
      ios: {
        shadowColor: '#1E3248',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
      default: {
        shadowColor: '#1E3248',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 1,
      },
    })!,
  },
};
