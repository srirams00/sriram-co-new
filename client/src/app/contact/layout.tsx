import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — Trichy & Chennai Store Locations & Support',
  description: 'Get in touch with Sriram & Co. Reach our customer support, call or WhatsApp +91 93454 03136, or visit our physical store branches in Trichy and Chennai.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Sriram & Co | Store Locations & Support',
    description: 'Reach our customer support team or visit our physical store showrooms in Trichy and Chennai.',
    url: '/contact',
    type: 'website',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
