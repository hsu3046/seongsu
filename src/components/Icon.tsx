import type { CSSProperties } from 'react';

export type IconName = 'passport' | 'compass' | 'arrow' | 'chevron' | 'coffee' | 'bakery' | 'objects' | 'courtyard' | 'garden' | 'sun' | 'sunrise' | 'moon' | 'pin' | 'check' | 'close' | 'plus' | 'minus' | 'target' | 'bookmark' | 'footsteps' | 'spark' | 'help' | 'clock' | 'reset' | 'photo' | 'expand' | 'contract' | 'sliders';
const paths: Record<IconName, string> = {
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  contract: 'M3 8h5V3m13 5h-5V3M8 21v-5H3m13 5v-5h5',
  sliders: 'M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6M7 14v6',
  passport: 'M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 0v18m4-14h4m-4 11h4m-3-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  compass: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5 5-3Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  chevron: 'm9 5 7 7-7 7',
  coffee: 'M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm12 1h2a3 3 0 0 1 0 6h-2M3 22h16M7 2v2m5-2v2',
  bakery: 'm6 18-3-5 3-4 5 2 2 5-4 4-3-2Zm0-9 3-5 6-1 4 4-1 6-5 3m-4-5 1-6m3 11 5-3m-3-9-1 7',
  objects: 'm3 7 9-4 9 4-9 4-9-4Zm0 0v11l9 4 9-4V7m-9 4v11M7 5l10 5',
  courtyard: 'M4 21V9a8 8 0 0 1 16 0v12M8 21V10a4 4 0 0 1 8 0v11M3 21h18m-9-17v2M5 9h2m10 0h2',
  garden: 'M12 21v-6m0 1C3 16 2 9 4 4c7-1 9 4 8 10m0-1C12 5 16 2 22 3c1 7-3 12-10 12M7 8l5 7m5-7-5 7',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
  sunrise: 'M3 18h18M6 15a6 6 0 0 1 12 0M12 2v4m-3-1 3-3 3 3M2 11l2 1m16 0 2-1M4 21h16',
  moon: 'M20 15A8 8 0 0 1 9 4a9 9 0 1 0 11 11Z',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Zm-4 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  target: 'M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM12 2v3m0 14v3M2 12h3m14 0h3',
  bookmark: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z',
  footsteps: 'M6 2c-3 1-3 6-1 8l3 1 2-4-1-4-3-1Zm-1 12 4 1-1 5-3-1v-5Zm12-5c-3 1-3 6-1 8l3 1 2-4-1-4-3-1Zm-1 12 3 1',
  spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',
  help: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 4h.01',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v6l4 2',
  reset: 'M3 10a9 9 0 1 1 1 8M3 4v6h6',
  photo: 'M3 4h18v16H3V4Zm0 12 6-6 5 6 3-3 4 5M16 8h.01',
};
export function Icon({ name, size = 20, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}><path d={paths[name]} /></svg>;
}
