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

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sriramandco.in').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Sri Ram & Co | Good tools. Better living.',
    template: '%s | Sri Ram & Co',
  },
  description: 'Reliable home appliances, cleaning equipment, power tools, and kitchen essentials. Direct store delivery and trusted service from Trichy & Chennai.',
  keywords: [
    'home appliances',
    'power tools',
    'kitchen appliances',
    'cleaning equipment',
    'Sri Ram and Co',
    'Sriram and Co',
    'Trichy',
    'Chennai',
    'Tamil Nadu',
    'online store',
    'buy tools online',
  ],
  authors: [{ name: 'Sriram & Co' }],
  creator: 'Sriram & Co',
  publisher: 'Sriram & Co',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Sri Ram & Co — Good tools. Better living.',
    description: 'Reliable home appliances, power tools, and kitchen essentials backed by 35 years of trusted store service.',
    url: siteUrl,
    siteName: 'Sri Ram & Co',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Sri Ram & Co Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sri Ram & Co — Good tools. Better living.',
    description: 'Reliable home appliances, power tools, and kitchen essentials backed by 35 years of trusted store service.',
    images: ['/logo.png'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HomeGoodsStore',
  name: 'Sri Ram & Co',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  image: `${siteUrl}/logo.png`,
  description: 'Trusted retailer for home appliances, power tools, cleaning equipment, and kitchen essentials in Trichy and Chennai.',
  telephone: '+919345403136',
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'No. 11, Vinola Complex, Thanjai Main Road',
    addressLocality: 'Trichy',
    addressRegion: 'Tamil Nadu',
    postalCode: '620014',
    addressCountry: 'IN',
  },
  department: [
    {
      '@type': 'Store',
      name: 'Sri Ram & Co — Trichy Main Branch',
      telephone: '+919345403136',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'No. 11, Vinola Complex, Thanjai Main Road',
        addressLocality: 'Trichy',
        addressRegion: 'Tamil Nadu',
        postalCode: '620014',
        addressCountry: 'IN',
      },
    },
    {
      '@type': 'Store',
      name: 'Sri Ram & Co — Chennai Experience Store',
      telephone: '+919345403136',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'New No. 99/2, Kothaval, Chavadi Street, West Saidapet',
        addressLocality: 'Chennai',
        addressRegion: 'Tamil Nadu',
        postalCode: '600015',
        addressCountry: 'IN',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${montserrat.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
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
