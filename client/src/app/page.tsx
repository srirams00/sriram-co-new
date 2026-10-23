import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import TrustFeatures from '@/components/home/TrustFeatures';
import LazyHomeSection from '@/components/home/LazyHomeSection';
import { api } from '@/lib/api';

export default async function HomePage() {
  const categories = await api.getCategories();

  return (
    <>
      <HeroSection />
      <TrustFeatures />
      <LazyHomeSection section="specialProducts" />
      <LazyHomeSection section="categories" categoryData={categories} />
      <LazyHomeSection section="bestSellers" />
      <LazyHomeSection section="testimonials" />
      <LazyHomeSection section="howItWorks" />
      <LazyHomeSection section="stores" />
      <LazyHomeSection section="contact" />
    </>
  );
}
