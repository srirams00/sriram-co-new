import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import TrustFeatures from '@/components/home/TrustFeatures';
import CategoryGrid from '@/components/home/CategoryGrid';
import BestSellersGrid from '@/components/home/BestSellersGrid';
import PromoEditorialGrid from '@/components/home/PromoEditorialGrid';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import HowItWorks from '@/components/home/HowItWorks';
import StoreLocationsSection from '@/components/home/StoreLocationsSection';
import ContactCtaBar from '@/components/home/ContactCtaBar';
import { api } from '@/lib/api';

export default async function HomePage() {
  const [categories, bestSellers, testimonials, stores] = await Promise.all([
    api.getCategories(),
    api.getBestSellers(),
    api.getTestimonials(),
    api.getStores(),
  ]);

  return (
    <>
      <HeroSection />
      <TrustFeatures />
      <CategoryGrid categories={categories} />
      <BestSellersGrid products={bestSellers} />
      <PromoEditorialGrid />
      <TestimonialsSection testimonials={testimonials} />
      <HowItWorks />
      <StoreLocationsSection stores={stores} />
      <ContactCtaBar />
    </>
  );
}
