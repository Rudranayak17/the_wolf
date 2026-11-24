import { APP_COUNTRIES, DEFAULT_COUNTRY } from './countries';

const GEO_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_KEY ||
  import.meta.env.VITE_GOOGLE_TRANSLATE_KEY ||
  '';

const GEO_STORAGE_KEY = 'app_detected_country_v1';
const GEO_REQUEST_TIMEOUT_MS = 8000;

export interface GeoCountryResult {
  countryCode: string;
  countryName: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  isDetected: boolean;
  source: 'google' | 'public-ip' | 'cache' | 'fallback';
}

interface AddressComponent {
  long_name?: string;
  short_name?: string;
  types?: string[];
}

interface GeocodeResult {
  formatted_address?: string;
  address_components?: AddressComponent[];
}

interface CachedGeo extends GeoCountryResult {
  detectedAt?: number;
}

let detectionInFlight: Promise<GeoCountryResult> | null = null;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEO_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function readStorage(): CachedGeo | null {
  try {
    const cached = localStorage.getItem(GEO_STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as CachedGeo;
    if (!parsed?.countryCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(result: GeoCountryResult): void {
  try {
    localStorage.setItem(
      GEO_STORAGE_KEY,
      JSON.stringify({ ...result, detectedAt: Date.now() }),
    );
  } catch {
    // Ignore private-mode storage failures.
  }
}

function readComponent(
  components: AddressComponent[],
  type: string,
  useShort = false,
): string | undefined {
  for (const component of components) {
    if (!Array.isArray(component.types) || !component.types.includes(type)) continue;
    const value = String((useShort ? component.short_name : component.long_name) || '').trim();
    if (value) return value;
  }
  return undefined;
}

function readPlace(results: GeocodeResult[]): Omit<GeoCountryResult, 'lat' | 'lng' | 'isDetected' | 'source'> | null {
  for (const result of results) {
    const components = Array.isArray(result.address_components) ? result.address_components : [];
    const detectedCountryCode = readComponent(components, 'country', true)?.toUpperCase();
    if (!detectedCountryCode) continue;

    const detectedCountryName = readComponent(components, 'country');
    const match = APP_COUNTRIES.find((country) => country.code === detectedCountryCode);
    const countryName = match?.name || detectedCountryName || detectedCountryCode;
    const city =
      readComponent(components, 'locality') ||
      readComponent(components, 'postal_town') ||
      readComponent(components, 'administrative_area_level_2');
    const region = readComponent(components, 'administrative_area_level_1');
    const postalCode = readComponent(components, 'postal_code');
    const formatted = String(result.formatted_address || '').trim();
    const composed = [city, region, postalCode, countryName].filter(Boolean).join(', ');
    const isPlusCode = /^[A-Z0-9]{4,}\+[A-Z0-9]{2,}/i.test(formatted);
    const address = (!formatted || isPlusCode ? composed : formatted) || undefined;

    return {
      countryCode: match?.code || detectedCountryCode,
      countryName,
      address: address || undefined,
      city,
      region,
      postalCode,
    };
  }
  return null;
}

export function detectCountryFromGoogleGeoIp(): Promise<GeoCountryResult> {
  if (!detectionInFlight) {
    detectionInFlight = detectCountryFromGoogleGeoIpInternal().finally(() => {
      detectionInFlight = null;
    });
  }
  return detectionInFlight;
}

/**
 * Approximate visitor location without a browser permission prompt.
 * 1. Google Geolocation with considerIp
 * 2. Google reverse geocoding for country, area, and coordinates
 * 3. Public IP lookup if Google is unavailable
 */
async function detectCountryFromGoogleGeoIpInternal(): Promise<GeoCountryResult> {
  if (!GEO_API_KEY) {
    return detectCountryFromPublicIp();
  }

  try {
    const geolocateUrl = `https://www.googleapis.com/geolocation/v1/geolocate?key=${encodeURIComponent(GEO_API_KEY)}`;
    const geoRes = await fetchWithTimeout(geolocateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ considerIp: true }),
    });

    if (!geoRes.ok) {
      console.warn('[GeoIP] Google Geolocate API returned status:', geoRes.status);
      return detectCountryFromPublicIp();
    }

    const geoData = (await geoRes.json()) as { location?: { lat?: number; lng?: number } };
    const lat = geoData?.location?.lat;
    const lng = geoData?.location?.lng;

    if (lat == null || lng == null) {
      console.warn('[GeoIP] No location coordinates received in Geolocate response');
      return detectCountryFromPublicIp();
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(`${lat},${lng}`)}&key=${encodeURIComponent(GEO_API_KEY)}`;
    const revRes = await fetchWithTimeout(geocodeUrl);

    if (!revRes.ok) {
      console.warn('[GeoIP] Google Geocode API returned status:', revRes.status);
      return getFallbackCountry(lat, lng);
    }

    const revData = (await revRes.json()) as { results?: GeocodeResult[] };
    const place = Array.isArray(revData?.results) ? readPlace(revData.results) : null;

    if (place) {
      const result: GeoCountryResult = {
        ...place,
        lat,
        lng,
        isDetected: true,
        source: 'google',
      };
      writeStorage(result);
      console.info(
        `[GeoIP] Country detected: ${result.countryCode} (${result.countryName}) [lat: ${lat}, lng: ${lng}]`,
      );
      return result;
    }

    return getFallbackCountry(lat, lng);
  } catch (error: unknown) {
    console.warn('[GeoIP] Failed to detect country via Google GeoIP:', errorMessage(error));
    return detectCountryFromPublicIp();
  }
}

async function detectCountryFromPublicIp(): Promise<GeoCountryResult> {
  try {
    const response = await fetchWithTimeout('https://ipwho.is/');
    if (!response.ok) return getFallbackCountry();

    const data = (await response.json()) as {
      success?: boolean;
      latitude?: number;
      longitude?: number;
      country_code?: string;
      country?: string;
      city?: string;
      region?: string;
      postal?: string;
    };

    const lat = Number(data?.latitude);
    const lng = Number(data?.longitude);
    if (data?.success === false || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return getFallbackCountry();
    }

    const countryCode = String(data?.country_code || DEFAULT_COUNTRY).toUpperCase();
    const countryMeta = APP_COUNTRIES.find((country) => country.code === countryCode);
    const countryName = countryMeta?.name || String(data?.country || countryCode);
    const city = String(data?.city || '').trim() || undefined;
    const region = String(data?.region || '').trim() || undefined;
    const postalCode = String(data?.postal || '').trim() || undefined;
    const address = [city, region, postalCode, countryName].filter(Boolean).join(', ');

    const result: GeoCountryResult = {
      countryCode,
      countryName,
      address,
      city,
      region,
      postalCode,
      lat,
      lng,
      isDetected: true,
      source: 'public-ip',
    };
    writeStorage(result);
    return result;
  } catch (error: unknown) {
    console.warn('[GeoIP] Public IP fallback failed:', errorMessage(error));
    return getFallbackCountry();
  }
}

async function getFallbackCountry(lat?: number, lng?: number): Promise<GeoCountryResult> {
  const cached = readStorage();
  if (cached?.countryCode) {
    return {
      countryCode: cached.countryCode,
      countryName: cached.countryName || cached.countryCode,
      address: cached.address,
      city: cached.city,
      region: cached.region,
      postalCode: cached.postalCode,
      lat: cached.lat,
      lng: cached.lng,
      isDetected: false,
      source: 'cache',
    };
  }

  const defaultMeta = APP_COUNTRIES.find((country) => country.code === DEFAULT_COUNTRY);
  const fallback: GeoCountryResult = {
    countryCode: DEFAULT_COUNTRY,
    countryName: defaultMeta ? defaultMeta.name : 'India',
    ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
    isDetected: false,
    source: 'fallback',
  };

  if (fallback.lat != null && fallback.lng != null) {
    writeStorage(fallback);
  }
  return fallback;
}
