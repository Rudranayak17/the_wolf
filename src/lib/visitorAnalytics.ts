import { isFirebaseConfigured, loadFirebase } from './firebase';

const VISITOR_ID_KEY = 'analytics_visitor_id';
const SESSION_ID_KEY = 'analytics_session_id';
const SAVED_SESSION_KEY = 'analytics_saved_session';
const CONSENT_KEY = 'analytics_consent';

export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

export type AnalyticsSaveResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; message: string }
  | { ok: false; skipped: false; message: string };

type DeviceType = 'Mobile' | 'Desktop' | 'Tablet';
type LocationSource = 'ip-lookup' | 'unavailable';

type IpLookup = {
  ipAddress: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  locationSource: LocationSource;
};

type WebsiteVisitorWrite = {
  visitorId: string;
  sessionId: string;
  ipAddress: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  deviceType: DeviceType;
  deviceModel: string | null;
  manufacturer: string | null;
  operatingSystem: string;
  osVersion: string | null;
  browser: string;
  browserVersion: string | null;
  userAgent: string;
  screenResolution: string;
  devicePixelRatio: number | null;
  touchSupport: boolean;
  cpuCores: number | null;
  deviceMemory: number | null;
  timezone: string | null;
  language: string | null;
  cookiesEnabled: boolean;
  online: boolean;
  pageUrl: string;
  referrer: string | null;
  locationSource: LocationSource;
};

let inFlight: Promise<AnalyticsSaveResult> | null = null;

function consentRequired(): boolean {
  return import.meta.env.VITE_ANALYTICS_REQUIRE_CONSENT === 'true';
}

function ipLookupEnabled(): boolean {
  return import.meta.env.VITE_ANALYTICS_IP_LOOKUP !== 'false';
}

export function analyticsConsentRequired(): boolean {
  return consentRequired();
}

export function getAnalyticsConsent(): AnalyticsConsent {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (value === 'granted' || value === 'denied') return value;
  } catch {
    // Private mode can block storage. Treat that as unknown.
  }
  return 'unknown';
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, 'unknown'>): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Ignore storage failures. The in-memory decision still applies to this attempt.
  }
}

function mayCollect(): boolean {
  const consent = getAnalyticsConsent();
  if (consent === 'denied') return false;
  if (consentRequired() && consent !== 'granted') return false;
  return true;
}

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore private-mode storage failures.
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `visit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function idFrom(storage: Storage, key: string): string {
  const existing = readStorage(storage, key);
  if (existing) return existing;
  const created = createId();
  writeStorage(storage, key, created);
  return created;
}

function clip(value: string | null | undefined, max: number): string | null {
  const text = String(value || '').trim();
  if (!text) return null;
  return text.slice(0, max);
}

function finiteNumber(value: unknown, max: number): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) return null;
  return number;
}

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number;
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
    brands?: Array<{ brand: string; version: string }>;
  };
};

function detectDevice(userAgent: string, nav: NavigatorWithMemory): {
  deviceType: DeviceType;
  deviceModel: string | null;
  manufacturer: string | null;
  operatingSystem: string;
  osVersion: string | null;
} {
  const uaData = nav.userAgentData;
  const tablet = /iPad|Tablet|PlayBook|Silk/i.test(userAgent);
  const mobile = Boolean(uaData?.mobile) || /Mobi|iPhone|iPod|Android/i.test(userAgent);
  const deviceType: DeviceType = tablet ? 'Tablet' : mobile ? 'Mobile' : 'Desktop';

  let manufacturer: string | null = null;
  let deviceModel: string | null = null;
  if (/iPhone/i.test(userAgent)) {
    manufacturer = 'Apple';
    deviceModel = 'iPhone';
  } else if (/iPad/i.test(userAgent)) {
    manufacturer = 'Apple';
    deviceModel = 'iPad';
  } else if (/Macintosh/i.test(userAgent)) {
    manufacturer = 'Apple';
  } else {
    const androidDevice = userAgent.match(/Android\s[\d.]+;\s*([^;)]+)/i)?.[1]?.trim();
    if (androidDevice && !/linux|wv|mobile/i.test(androidDevice)) {
      deviceModel = androidDevice.slice(0, 80);
      if (/pixel/i.test(androidDevice)) manufacturer = 'Google';
      else if (/samsung|sm-/i.test(androidDevice)) manufacturer = 'Samsung';
    }
  }

  let operatingSystem = clip(uaData?.platform, 80) || 'Unknown';
  let osVersion: string | null = null;
  const windows = userAgent.match(/Windows NT ([0-9.]+)/);
  const mac = userAgent.match(/Mac OS X ([0-9_]+)/);
  const android = userAgent.match(/Android ([0-9.]+)/);
  const ios = userAgent.match(/(?:iPhone OS|CPU OS) ([0-9_]+)/);
  if (windows) {
    operatingSystem = 'Windows';
    osVersion = windows[1];
  } else if (ios) {
    operatingSystem = 'iOS';
    osVersion = ios[1].replace(/_/g, '.');
  } else if (android) {
    operatingSystem = 'Android';
    osVersion = android[1];
  } else if (mac) {
    operatingSystem = 'macOS';
    osVersion = mac[1].replace(/_/g, '.');
  } else if (/Linux/i.test(userAgent)) {
    operatingSystem = 'Linux';
  }

  return { deviceType, deviceModel, manufacturer, operatingSystem, osVersion };
}

function detectBrowser(userAgent: string, nav: NavigatorWithMemory): { browser: string; browserVersion: string | null } {
  const brands = nav.userAgentData?.brands?.filter((brand) => !/not.?a.?brand/i.test(brand.brand)) || [];
  const branded = brands.find((brand) => !/chromium/i.test(brand.brand)) || brands[0];
  if (branded?.brand) {
    return { browser: branded.brand.slice(0, 80), browserVersion: clip(branded.version, 40) };
  }

  const patterns: Array<[string, RegExp]> = [
    ['Edge', /Edg\/([0-9.]+)/],
    ['Chrome', /Chrome\/([0-9.]+)/],
    ['Firefox', /Firefox\/([0-9.]+)/],
    ['Safari', /Version\/([0-9.]+)/],
  ];
  for (const [name, pattern] of patterns) {
    const match = userAgent.match(pattern);
    if (match) return { browser: name, browserVersion: match[1] };
  }
  return { browser: 'Unknown', browserVersion: null };
}

async function lookupIp(): Promise<IpLookup> {
  const empty: IpLookup = {
    ipAddress: null,
    country: null,
    state: null,
    city: null,
    locationSource: 'unavailable',
  };
  if (!ipLookupEnabled()) return empty;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('https://ipwho.is/', { signal: controller.signal });
    if (!response.ok) return empty;
    const data = (await response.json()) as {
      success?: boolean;
      ip?: string;
      country?: string;
      region?: string;
      city?: string;
    };
    if (data.success === false) return empty;
    return {
      ipAddress: clip(data.ip, 64),
      country: clip(data.country, 80),
      state: clip(data.region, 80),
      city: clip(data.city, 80),
      locationSource: 'ip-lookup',
    };
  } catch {
    return empty;
  } finally {
    clearTimeout(timeout);
  }
}

function collectLocal(visitorId: string, sessionId: string, ip: IpLookup): WebsiteVisitorWrite {
  const nav = navigator as NavigatorWithMemory;
  const userAgent = navigator.userAgent || '';
  const device = detectDevice(userAgent, nav);
  const browser = detectBrowser(userAgent, nav);
  const width = window.screen?.width;
  const height = window.screen?.height;

  return {
    visitorId,
    sessionId,
    ipAddress: ip.ipAddress,
    country: ip.country,
    state: ip.state,
    city: ip.city,
    deviceType: device.deviceType,
    deviceModel: device.deviceModel,
    manufacturer: device.manufacturer,
    operatingSystem: device.operatingSystem,
    osVersion: clip(device.osVersion, 40),
    browser: browser.browser,
    browserVersion: browser.browserVersion,
    userAgent: userAgent.slice(0, 512),
    screenResolution: Number.isFinite(width) && Number.isFinite(height) ? `${width}x${height}` : 'unknown',
    devicePixelRatio: finiteNumber(window.devicePixelRatio, 20),
    touchSupport: navigator.maxTouchPoints > 0,
    cpuCores: finiteNumber(navigator.hardwareConcurrency, 256),
    deviceMemory: finiteNumber(nav.deviceMemory, 1024),
    timezone: clip(Intl.DateTimeFormat().resolvedOptions().timeZone, 80),
    language: clip(navigator.language, 40),
    cookiesEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    pageUrl: window.location.href.slice(0, 1000),
    referrer: clip(document.referrer, 1000),
    locationSource: ip.locationSource,
  };
}

function resultError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : '';
  if (code === 'permission-denied' || message.includes('insufficient permissions')) {
    return 'Firestore rejected the visit. Publish the updated rules in firestore.rules, then refresh.';
  }
  return message || 'Visit analytics could not be saved.';
}

async function trackWebsiteVisitorInternal(): Promise<AnalyticsSaveResult> {
  if (!mayCollect()) {
    return {
      ok: false,
      skipped: true,
      message: consentRequired()
        ? 'Waiting for analytics consent.'
        : 'Analytics is turned off in this browser.',
    };
  }

  const visitorId = idFrom(localStorage, VISITOR_ID_KEY);
  const sessionId = idFrom(sessionStorage, SESSION_ID_KEY);
  if (readStorage(sessionStorage, SAVED_SESSION_KEY) === sessionId) {
    return { ok: true, id: sessionId };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, skipped: false, message: 'Firebase is not configured.' };
  }

  try {
    const firebase = await loadFirebase();
    if (!firebase) return { ok: false, skipped: false, message: 'Firebase is not configured.' };
    if (!mayCollect()) {
      return { ok: false, skipped: true, message: 'Analytics is turned off in this browser.' };
    }

    const record = collectLocal(visitorId, sessionId, await lookupIp());
    const { doc, serverTimestamp, setDoc } = await import('firebase/firestore');
    await setDoc(doc(firebase.db, 'website_visitors', sessionId), {
      ...record,
      visitedAt: serverTimestamp(),
    });
    writeStorage(sessionStorage, SAVED_SESSION_KEY, sessionId);
    return { ok: true, id: sessionId };
  } catch (error: unknown) {
    return { ok: false, skipped: false, message: resultError(error) };
  }
}

export function trackWebsiteVisitor(options?: { force?: boolean }): Promise<AnalyticsSaveResult> {
  if (options?.force) inFlight = null;
  if (!inFlight) {
    const run = trackWebsiteVisitorInternal().then((result) => {
      if (!result.ok) inFlight = null;
      return result;
    });
    inFlight = run;
  }
  return inFlight;
}
