import React from 'react';
import { View, ViewStyle } from 'react-native';
import { CONTENT_WIDTH } from '../../hooks/useResponsive';

interface ContentColumnProps {
  children: React.ReactNode;
  width?: 'reading' | 'app' | 'appWide';
  style?: ViewStyle;
}

/**
 * Centers content at a capped max-width so desktop web reads as an intentional
 * layout, not a stretched phone. `reading` (~760) for prose; `app`/`appWide`
 * for grids and dashboards. A no-op visual on phones (100% width under the cap).
 */
export function ContentColumn({ children, width = 'reading', style }: ContentColumnProps) {
  return (
    <View style={[{ width: '100%', maxWidth: CONTENT_WIDTH[width], alignSelf: 'center' }, style]}>
      {children}
    </View>
  );
}
