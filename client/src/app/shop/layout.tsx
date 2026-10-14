import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All Appliances, Power Tools & Essentials',
  description: 'Browse the complete catalog of home appliances, power tools, kitchen gadgets, cleaning equipment, and personal care products at Sri Ram & Co. Fast delivery across Tamil Nadu.',
  alternates: {
    canonical: '/shop',
  },
  openGraph: {
    title: 'Shop All Products | Sri Ram & Co',
    description: 'Explore quality home appliances, tools, and kitchen essentials backed by 35 years of trusted service.',
    url: '/shop',
    type: 'website',
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
