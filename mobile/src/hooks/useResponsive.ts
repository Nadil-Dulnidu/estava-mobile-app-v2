/**
 * Responsive utility for Estava — supports iPhone SE (320px) → iPad Pro (1366px)
 * Uses useWindowDimensions so all values re-compute on rotation/resize.
 */
import { useWindowDimensions } from 'react-native';

// Design baseline is 390px (iPhone 14 Pro)
const BASE_WIDTH = 390;

// Breakpoints
export const BP = {
  phone_sm: 320,   // iPhone SE / mini
  phone:    390,   // iPhone 14
  phone_lg: 430,   // iPhone Plus/Max
  tablet:   768,   // iPad mini / Android tablet
  tablet_lg: 1024, // iPad Pro 11"
  desktop:  1280,  // iPad Pro 13"
} as const;

export type Breakpoint = keyof typeof BP;

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isPhoneSm  = width < BP.phone;
  const isPhone    = width < BP.tablet;
  const isTablet   = width >= BP.tablet;
  const isTabletLg = width >= BP.tablet_lg;

  /**
   * Scale a number linearly from the 390px baseline.
   * Clamped at ±25% of the value so tiny/huge screens stay usable.
   */
  const scale = (size: number): number => {
    const ratio = width / BASE_WIDTH;
    const scaled = size * ratio;
    const min = size * 0.75;
    const max = size * 1.25;
    return Math.round(Math.min(max, Math.max(min, scaled)));
  };

  /** Moderate scale — less aggressive than scale(), good for font sizes */
  const mScale = (size: number): number => {
    const ratio = width / BASE_WIDTH;
    const delta = ratio - 1;
    return Math.round(size + delta * size * 0.4);
  };

  /** Content max width — constrains wide layouts on tablets */
  const contentMaxWidth = isTabletLg ? 900 : isTablet ? 700 : width;

  /**
   * Return different values per breakpoint.
   * Usage: rBreak({ phone_sm: 12, phone: 14, tablet: 16 })
   */
  const rBreak = <T>(map: Partial<Record<Breakpoint, T>> & { phone: T }): T => {
    if (isTabletLg && map.tablet_lg !== undefined) return map.tablet_lg;
    if (isTablet   && map.tablet !== undefined)    return map.tablet;
    if (width >= BP.phone_lg && map.phone_lg !== undefined) return map.phone_lg;
    if (isPhoneSm  && map.phone_sm !== undefined) return map.phone_sm;
    return map.phone;
  };

  /** Number of columns for grid layouts */
  const numCols = (phoneVal = 1, tabletVal = 2, tabletLgVal = 3) => {
    if (isTabletLg) return tabletLgVal;
    if (isTablet)   return tabletVal;
    return phoneVal;
  };

  return {
    width,
    height,
    isPhoneSm,
    isPhone,
    isTablet,
    isTabletLg,
    scale,
    mScale,
    contentMaxWidth,
    rBreak,
    numCols,
  };
};
