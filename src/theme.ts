import { Platform, useWindowDimensions } from 'react-native';

// One serif family throughout. iOS ships Georgia; Android/RN only exposes
// generic font-family buckets, so 'serif' is the closest honest match
// (Noto Serif / Droid Serif depending on OEM).
export const serifFont = Platform.select({ ios: 'Georgia', default: 'serif' });

export const colors = {
  field: '#1E2A2C', // background
  ink: '#E8E2D6', // pointer text
  quiet: '#8A9694', // secondary text, borders
};

// Mimics CSS clamp(min, vw, max) using window width. Values are in px,
// vwPercent is the vw portion from the original clamp() (e.g. 5 for 5vw).
export function useClampFontSize(minPx: number, vwPercent: number, maxPx: number) {
  const { width } = useWindowDimensions();
  const preferred = (width * vwPercent) / 100;
  return Math.min(maxPx, Math.max(minPx, preferred));
}
