import { detectCountryFromGoogleGeoIp, type GeoCountryResult } from '../utils/geoIp';
import { isFirebaseConfigured, loadFirebase } from './firebase';

const VISITOR_ID_KEY = 'app_visitor_id_v1';
const VISITOR_SAVED_KEY = 'app_visitor_saved_v1';

let detection: Promise<GeoCountryResult> | null = null;

export type SaveVisitorResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

function canStore(geo: GeoCountryResult): boolean {
  return (
    geo.lat != null &&
    geo.lng != null &&
    Number.isFinite(geo.lat) &&
    Number.isFinite(geo.lng) &&
    geo.source !== 'fallback'
  );
}

function visitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function hasBeenSaved(id: string): boolean {
  try {
    return localStorage.getItem(VISITOR_SAVED_KEY) === id;
  } catch {
    return false;
  }
}

function markSaved(id: string): void {
  try {
    localStorage.setItem(VISITOR_SAVED_KEY, id);
  } catch {
    // Ignore private-mode storage failures.
  }
}

function saveErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : '';
  if (code === 'permission-denied' || message.includes('insufficient permissions')) {
    return 'Firestore rejected the save. Open Firestore rules, publish the rules in firestore.rules, then try again.';
  }
  return message || 'Could not store this visitor.';
}

export async function saveVisitor(geo: GeoCountryResult): Promise<SaveVisitorResult> {
  if (!canStore(geo)) {
    return { ok: false, message: 'Location was not accurate enough to store.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, message: 'Firebase is not configured.' };
  }

  const id = visitorId();

  try {
    const firebase = await loadFirebase();
    if (!firebase) return { ok: false, message: 'Firebase is not configured.' };

    const { doc, increment, serverTimestamp, setDoc } = await import('firebase/firestore');
    const firstVisit = !hasBeenSaved(id);

    await setDoc(
      doc(firebase.db, 'visitors', id),
      {
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        address: geo.address ?? null,
        city: geo.city ?? null,
        region: geo.region ?? null,
        postalCode: geo.postalCode ?? null,
        lat: geo.lat,
        lng: geo.lng,
        isDetected: geo.isDetected,
        source: geo.source,
        page: 'home',
        lastSeenAt: serverTimestamp(),
        visitCount: increment(1),
        ...(firstVisit ? { firstSeenAt: serverTimestamp() } : {}),
      },
      { merge: true },
    );

    markSaved(id);
    return { ok: true, id };
  } catch (error: unknown) {
    return { ok: false, message: saveErrorMessage(error) };
  }
}

export function detectHomeVisitor(): Promise<GeoCountryResult> {
  if (!detection) detection = detectCountryFromGoogleGeoIp();
  return detection;
}
