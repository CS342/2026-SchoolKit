import type { EntranceConfig } from '../types/document';

export function getEntranceKeyframes(animation: EntranceConfig['animation']): string {
  switch (animation) {
    case 'fade-in':
      return `
        @keyframes entrance-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
    case 'slide-up':
      return `
        @keyframes entrance-slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
    case 'scale-up':
      return `
        @keyframes entrance-scale-up {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
    case 'bounce':
      return `
        @keyframes entrance-bounce {
          0% { opacity: 0; transform: translateY(30px); }
          60% { opacity: 1; transform: translateY(-8px); }
          80% { transform: translateY(4px); }
          100% { transform: translateY(0); }
        }
      `;
  }
}

export function getEntranceAnimationName(animation: EntranceConfig['animation']): string {
  return `entrance-${animation}`;
}
