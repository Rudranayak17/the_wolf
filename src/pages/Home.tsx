import { useEffect, useMemo, useState } from 'react';
import { HeroCarousel } from '../components/HeroCarousel';
import { ProductCarousel } from '../components/ProductCarousel';
import { products } from '../data/products';
import { AnalyticsNotice } from '../components/AnalyticsNotice';
import { trackWebsiteVisitor } from '../lib/visitorAnalytics';
import { detectHomeVisitor, saveVisitor, type SaveVisitorResult } from '../lib/visitors';
import type { GeoCountryResult } from '../utils/geoIp';

export const Home = () => {
  const trending = useMemo(() => products.slice(0, 4), []);
  const newArrivals = useMemo(() => [...products].reverse(), []);
  const bestSellers = useMemo(() => [...products].sort(() => Math.random() - 0.5), []);
  const [place, setPlace] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeoCountryResult | null>(null);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error' | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [analyticsMessage, setAnalyticsMessage] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState(false);

  function reportAnalytics(result: Awaited<ReturnType<typeof trackWebsiteVisitor>>) {
    if (!result.ok && result.skipped) return;
    if (result.ok) {
      setAnalyticsError(false);
      setAnalyticsMessage(`Visit saved in website_visitors/${result.id}`);
      return;
    }
    setAnalyticsError(true);
    setAnalyticsMessage(result.message);
  }

  async function storeVisitor(nextGeo: GeoCountryResult) {
    setSaveState('saving');
    setSaveMessage('Saving this visit to Firestore…');
    const result: SaveVisitorResult = await saveVisitor(nextGeo);
    if (result.ok) {
      setSaveState('saved');
      setSaveMessage(`Saved in Firestore as visitors/${result.id}`);
      return;
    }
    setSaveState('error');
    setSaveMessage(result.message);
  }

  useEffect(() => {
    let active = true;
    detectHomeVisitor()
      .then((nextGeo) => {
        if (!active) return;
        const label = nextGeo.address || [nextGeo.city, nextGeo.region, nextGeo.countryName].filter(Boolean).join(', ');
        setGeo(nextGeo);
        setPlace(label || nextGeo.countryName);
        return storeVisitor(nextGeo);
      })
      .catch(() => {
        if (!active) return;
        setPlace(null);
        setSaveState('error');
        setSaveMessage('Could not detect this visit.');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    trackWebsiteVisitor()
      .then((result) => {
        if (active) reportAnalytics(result);
      })
      .catch(() => {
        if (!active) return;
        setAnalyticsError(true);
        setAnalyticsMessage('Visit analytics could not be saved.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <HeroCarousel />

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        {place ? (
          <p className="text-center text-sm tracking-wide text-gray-500">Shipping to {place}</p>
        ) : null}
        {saveMessage ? (
          <div className="text-center text-sm">
            <p className={saveState === 'error' ? 'text-red-600' : 'text-gray-500'}>{saveMessage}</p>
            {saveState === 'error' && geo ? (
              <button
                type="button"
                onClick={() => void storeVisitor(geo)}
                className="mt-3 border border-black px-4 py-2 text-xs font-medium uppercase tracking-wide"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}
        {analyticsMessage ? (
          <p className={`text-center text-sm ${analyticsError ? 'text-red-600' : 'text-gray-500'}`}>
            {analyticsMessage}
          </p>
        ) : null}
        <ProductCarousel title="New Arrivals" products={newArrivals} />
        <ProductCarousel title="Trending Now" products={trending} />
        <ProductCarousel title="Best Sellers" products={bestSellers} />
      </div>
      <AnalyticsNotice
        onConsentGranted={() => {
          void trackWebsiteVisitor({ force: true }).then(reportAnalytics);
        }}
      />
    </div>
  );
};
