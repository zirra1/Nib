/** Which computer and browser the visitor is on, to recommend the right way to apply a cursor. */
export type OS = 'mac' | 'windows' | 'chromeos' | 'linux' | 'mobile' | 'unknown';

export interface Platform { os: OS; chromium: boolean }

export function detectPlatform(nav: { userAgent: string; platform?: string; maxTouchPoints?: number; userAgentData?: { platform?: string; mobile?: boolean; brands?: { brand: string }[] } } = navigator): Platform {
  const ua = nav.userAgent;
  const uad = nav.userAgentData;
  const p = (uad?.platform || nav.platform || '').toLowerCase();
  const chromium = !!uad?.brands?.some((b) => /chromium|google chrome|microsoft edge/i.test(b.brand)) || (/Chrome\//.test(ua) && !/Firefox|FxiOS/.test(ua));
  // iPads report themselves as Macs; touch points give them away.
  if (uad?.mobile || /Android|iPhone|iPod/i.test(ua) || (/Mac/i.test(ua) && (nav.maxTouchPoints ?? 0) > 1)) return { os: 'mobile', chromium };
  if (p.includes('mac') || /Macintosh/.test(ua)) return { os: 'mac', chromium };
  if (p.includes('win') || /Windows/.test(ua)) return { os: 'windows', chromium };
  if (p.includes('chrome os') || /CrOS/.test(ua)) return { os: 'chromeos', chromium };
  if (p.includes('linux') || /Linux/.test(ua)) return { os: 'linux', chromium };
  return { os: 'unknown', chromium };
}
