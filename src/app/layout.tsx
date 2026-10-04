 import type { Metadata } from 'next';
import '@/styles/globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';

export const metadata: Metadata = {
  title: 'Sriram & Co | Good tools. Better living.',
  description: 'Reliable home appliances, cleaning equipment, power tools, and kitchen essentials. Direct store delivery from Trichy & Chennai.',
  keywords: ['home appliances', 'power tools', 'kitchen appliances', 'cleaning equipment', 'Sriram and Co', 'Trichy', 'Chennai'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Sriram & Co — Good tools. Better living.',
    description: 'Reliable home appliances, power tools, and kitchen essentials backed by 35 years of trusted store service.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <WishlistProvider>
            <AnnouncementBar />
            <Header />
            <main>{children}</main>
            <Footer />
            <CartDrawer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
