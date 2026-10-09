'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';

const ADMIN_SLUGS = [
  'f0d06b7799107f8da21a05984c29bb10',
  '48191d90cc476d1c72aaec9997cc977c',
];

export default function StoreLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdminRoute =
    pathname?.startsWith('/admin') ||
    ADMIN_SLUGS.some((slug) => pathname?.includes(slug));

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
