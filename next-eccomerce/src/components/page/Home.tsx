import React from 'react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { ProductCarousel } from '@/components/ProductCarousel';
import { products } from '@/data/products';

export const Home = () => {
  // Simulate different product categories
  const trending = products.slice(0, 4);
  const newArrivals = [...products].reverse();
  const bestSellers = [...products].sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen">
      <HeroCarousel />
      
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        <ProductCarousel title="New Arrivals" products={newArrivals} />
        <ProductCarousel title="Trending Now" products={trending} />
        <ProductCarousel title="Best Sellers" products={bestSellers} />
      </div>
    </div>
  );
};