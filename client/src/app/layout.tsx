import type { Metadata } from 'next';
import { Poppins, Montserrat } from 'next/font/google';
import '@/styles/globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import StoreLayoutWrapper from '@/components/layout/StoreLayoutWrapper';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sri Ram & Co | Good tools. Better living.',
  description: 'Reliable home appliances, cleaning equipment, power tools, and kitchen essentials. Direct store delivery from Trichy & Chennai.',
  keywords: ['home appliances', 'power tools', 'kitchen appliances', 'cleaning equipment', 'Sri Ram and Co', 'Trichy', 'Chennai'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Sri Ram & Co — Good tools. Better living.',
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
    <html lang="en" className={`${poppins.variable} ${montserrat.variable}`}>
      <body>
        <CartProvider>
          <WishlistProvider>
            <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
