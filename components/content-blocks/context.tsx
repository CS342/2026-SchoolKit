// Shared context passed to every block renderer: theme, layout flag, resolved
// styles, color-token resolver, and the page-level step-modal opener. Keeps block
// components free of prop-drilling.
import React, { createContext, useContext } from 'react';
import { ThemeColors, ThemeShadows } from '../../constants/theme';
import { ColorToken } from '../../features/content/types';
import { resolveColor } from '../../features/content/tokens';
import { BlockStyles } from './styles';

export interface ResolvedStep {
  id: string;
  title: string;
  detail: string;
  icon: string;
  colorHex: string;
}

export interface BlockCtx {
  colors: ThemeColors;
  shadows: ThemeShadows;
  isDark: boolean;
  /** useWebLayout() — web at tablet width and up. */
  web: boolean;
  styles: BlockStyles;
  accent: ColorToken;
  resourceId?: string;
  tags: string[];
  /** Resolve a color token to a hex against the current theme primary. */
  color: (token: ColorToken) => string;
  /** Open the shared TTS step-detail modal (hosted by ContentPage). */
  onOpenStep: (step: ResolvedStep) => void;
  /** True when rendered inside the editor preview — navigations that leave the page are disabled. */
  preview?: boolean;
}

const Ctx = createContext<BlockCtx | null>(null);

export function BlockCtxProvider({ value, children }: { value: BlockCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBlockCtx(): BlockCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBlockCtx must be used within BlockCtxProvider');
  return v;
}

/** Build the `color` resolver bound to the current theme primary. */
export function makeColorResolver(primaryHex: string) {
  return (token: ColorToken) => resolveColor(token, primaryHex);
}
