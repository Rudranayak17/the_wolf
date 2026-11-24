import { useState } from 'react';
import {
  analyticsConsentRequired,
  getAnalyticsConsent,
  setAnalyticsConsent,
} from '../lib/visitorAnalytics';

type AnalyticsNoticeProps = {
  onConsentGranted?: () => void;
};

export function AnalyticsNotice({ onConsentGranted }: AnalyticsNoticeProps) {
  const [consent, setConsent] = useState(getAnalyticsConsent);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('analytics_notice_dismissed') === '1';
    } catch {
      return false;
    }
  });

  if (consent === 'denied') return null;
  if (dismissed && !analyticsConsentRequired()) return null;
  if (consent === 'granted' && dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem('analytics_notice_dismissed', '1');
    } catch {
      // The notice can stay hidden for this page view even if storage fails.
    }
    setDismissed(true);
  }

  function decline() {
    setAnalyticsConsent('denied');
    setConsent('denied');
    dismiss();
  }

  function accept() {
    setAnalyticsConsent('granted');
    setConsent('granted');
    dismiss();
    onConsentGranted?.();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          This homepage stores technical visit details in Firebase: browser, device, page address, and the
          approximate country, state, and city from your public IP. This is not GPS location.
        </p>
        <div className="flex shrink-0 gap-2">
          {analyticsConsentRequired() ? (
            <button
              type="button"
              onClick={accept}
              className="border border-black bg-black px-4 py-2 text-xs font-medium uppercase tracking-wide text-white"
            >
              Allow
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="border border-black bg-black px-4 py-2 text-xs font-medium uppercase tracking-wide text-white"
            >
              OK
            </button>
          )}
          <button
            type="button"
            onClick={decline}
            className="border border-gray-300 px-4 py-2 text-xs font-medium uppercase tracking-wide"
          >
            Opt out
          </button>
        </div>
      </div>
    </div>
  );
}
