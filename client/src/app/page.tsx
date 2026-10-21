import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import TrustFeatures from '@/components/home/TrustFeatures';
import LazyHomeSection from '@/components/home/LazyHomeSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustFeatures />
      <LazyHomeSection section="specialProducts" />
      <LazyHomeSection section="categories" />
      <LazyHomeSection section="bestSellers" />
      <LazyHomeSection section="testimonials" />
      <LazyHomeSection section="howItWorks" />
      <LazyHomeSection section="stores" />
      <LazyHomeSection section="contact" />
    </>
  );
}
