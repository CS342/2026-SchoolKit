import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveInfo {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  width: number;
  height: number;
}

/**
 * Hook for responsive design and platform detection
 * Breakpoints:
 * - mobile: < 768px
 * - tablet: 768px - 1023px
 * - desktop: >= 1024px
 */
export function useResponsive(): ResponsiveInfo {
  const getBreakpoint = (width: number): Breakpoint => {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      breakpoint: getBreakpoint(width),
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height } = window;
      setDimensions({
        width,
        height,
        breakpoint: getBreakpoint(width),
      });
    });

    return () => subscription?.remove();
  }, []);

  return {
    breakpoint: dimensions.breakpoint,
    isMobile: dimensions.breakpoint === 'mobile',
    isTablet: dimensions.breakpoint === 'tablet',
    isDesktop: dimensions.breakpoint === 'desktop',
    isWeb: Platform.OS === 'web',
    width: dimensions.width,
    height: dimensions.height,
  };
}
