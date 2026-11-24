import { FormEvent, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { loadFirebaseAuth } from '../../lib/firebase';

type VisitorRow = {
  id: string;
  visitorId: string;
  sessionId: string;
  ipAddress: string;
  place: string;
  device: string;
  browser: string;
  screenResolution: string;
  language: string;
  timezone: string;
  pageUrl: string;
  referrer: string;
  visitedAt: string;
  locationSource: string;
};

type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User; isAdmin: boolean };

function textOf(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value;
  return '—';
}

function timeOf(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    if (date instanceof Date && !Number.isNaN(date.getTime())) return date.toLocaleString();
  }
  return '—';
}

export function VisitorAnalytics() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [rows, setRows] = useState<VisitorRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    let active = true;

    loadFirebaseAuth()
      .then(async (firebase) => {
        if (!active) return;
        if (!firebase) {
          setAuthState({ status: 'signed-out' });
          setMessage('Firebase is not configured.');
          return;
        }
        const { onAuthStateChanged } = await import('firebase/auth');
        unsubscribe = onAuthStateChanged(firebase.auth, async (user) => {
          if (!user) {
            setAuthState({ status: 'signed-out' });
            setRows([]);
            return;
          }
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const adminDoc = await getDoc(doc(firebase.db, 'admins', user.uid));
            setAuthState({ status: 'signed-in', user, isAdmin: adminDoc.exists() });
            if (!adminDoc.exists()) {
              setMessage(`Signed in, but ${user.uid} is not an admin yet.`);
            }
          } catch (error: unknown) {
            setAuthState({ status: 'signed-in', user, isAdmin: false });
            setMessage(error instanceof Error ? error.message : 'Could not check admin access.');
          }
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAuthState({ status: 'signed-out' });
        setMessage(error instanceof Error ? error.message : 'Could not start Firebase Auth.');
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState.status !== 'signed-in' || !authState.isAdmin) return;
    let active = true;
    setLoadingRows(true);

    loadFirebaseAuth()
      .then(async (firebase) => {
        if (!firebase || !active) return;
        const { collection, getDocs, limit, orderBy, query } = await import('firebase/firestore');
        const snapshot = await getDocs(
          query(collection(firebase.db, 'website_visitors'), orderBy('visitedAt', 'desc'), limit(50)),
        );
        if (!active) return;
        setRows(
          snapshot.docs.map((entry) => {
            const data = entry.data();
            const place = [data.city, data.state, data.country].filter((part) => typeof part === 'string' && part).join(', ');
            const device = [data.deviceType, data.manufacturer, data.deviceModel, data.operatingSystem, data.osVersion]
              .filter((part) => typeof part === 'string' && part)
              .join(' · ');
            const browser = [data.browser, data.browserVersion].filter((part) => typeof part === 'string' && part).join(' ');
            return {
              id: entry.id,
              visitorId: textOf(data.visitorId),
              sessionId: textOf(data.sessionId),
              ipAddress: textOf(data.ipAddress),
              place: place || '—',
              device: device || '—',
              browser: browser || '—',
              screenResolution: textOf(data.screenResolution),
              language: textOf(data.language),
              timezone: textOf(data.timezone),
              pageUrl: textOf(data.pageUrl),
              referrer: textOf(data.referrer),
              visitedAt: timeOf(data.visitedAt),
              locationSource: textOf(data.locationSource),
            };
          }),
        );
        setMessage(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : 'Could not load visitors.');
      })
      .finally(() => {
        if (active) setLoadingRows(false);
      });

    return () => {
      active = false;
    };
  }, [authState]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const firebase = await loadFirebaseAuth();
    if (!firebase) {
      setMessage('Firebase is not configured.');
      return;
    }
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(firebase.auth, email, password);
    } catch (error: unknown) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        setMessage('Enable Email/Password in Firebase Authentication, then create an admin user.');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Sign in failed.');
    }
  }

  async function signOut() {
    const firebase = await loadFirebaseAuth();
    if (!firebase) return;
    const { signOut: firebaseSignOut } = await import('firebase/auth');
    await firebaseSignOut(firebase.auth);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Visitor analytics</h1>
          <p className="mt-2 text-sm text-gray-500">Approximate IP location and browser details from the homepage.</p>
        </div>
        {authState.status === 'signed-in' ? (
          <button type="button" onClick={() => void signOut()} className="border border-black px-4 py-2 text-xs uppercase tracking-wide">
            Sign out
          </button>
        ) : null}
      </div>

      {authState.status === 'loading' ? <p className="text-sm text-gray-500">Checking access…</p> : null}

      {authState.status === 'signed-out' ? (
        <form onSubmit={(event) => void signIn(event)} className="max-w-md space-y-4 bg-white p-6 shadow-sm">
          <label className="block text-sm">
            Admin email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2"
              required
            />
          </label>
          <button type="submit" className="bg-black px-4 py-2 text-xs font-medium uppercase tracking-wide text-white">
            Sign in
          </button>
          <ol className="list-decimal space-y-1 pl-4 text-xs text-gray-500">
            <li>Publish `firestore.rules` in the Firebase console.</li>
            <li>Enable Email/Password authentication and create an admin user.</li>
            <li>In Firestore, add a document at `admins/USER_UID`.</li>
            <li>Open this page again and sign in.</li>
          </ol>
        </form>
      ) : null}

      {message ? <p className="mb-4 text-sm text-red-600">{message}</p> : null}

      {authState.status === 'signed-in' && authState.isAdmin ? (
        loadingRows ? (
          <p className="text-sm text-gray-500">Loading visits…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No homepage visits have been stored yet.</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-3">Visited</th>
                  <th className="px-3 py-3">Place</th>
                  <th className="px-3 py-3">IP</th>
                  <th className="px-3 py-3">Device</th>
                  <th className="px-3 py-3">Browser</th>
                  <th className="px-3 py-3">Screen</th>
                  <th className="px-3 py-3">Language</th>
                  <th className="px-3 py-3">Timezone</th>
                  <th className="px-3 py-3">Page</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b align-top">
                    <td className="px-3 py-3 whitespace-nowrap">{row.visitedAt}</td>
                    <td className="px-3 py-3">
                      {row.place}
                      <span className="block text-xs text-gray-400">{row.locationSource}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{row.ipAddress}</td>
                    <td className="px-3 py-3">{row.device}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{row.browser}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{row.screenResolution}</td>
                    <td className="px-3 py-3">{row.language}</td>
                    <td className="px-3 py-3">{row.timezone}</td>
                    <td className="px-3 py-3 max-w-xs truncate" title={row.pageUrl}>
                      {row.pageUrl}
                      <span className="block text-xs text-gray-400 truncate" title={row.referrer}>
                        {row.referrer}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
}
