import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import ProductDetailsClient from '@/components/products/ProductDetailsClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sriramandco.in').replace(/\/+$/, '');

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await api.getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found at Sri Ram & Co.',
    };
  }

  const title = `${product.name} — Buy Online`;
  const description = `${product.name} in ${product.category}. ${product.shortDescription || product.fullDescription?.slice(0, 140)}. Price: ₹${product.price.toLocaleString('en-IN')}. Genuine quality with store guarantee from Sri Ram & Co.`;
  const canonicalUrl = `/product/${product.slug}`;
  const imageUrl = product.image.startsWith('http') ? product.image : `${siteUrl}${product.image}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} — ₹${product.price.toLocaleString('en-IN')} | Sri Ram & Co`,
      description,
      url: canonicalUrl,
      siteName: 'Sri Ram & Co',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — ₹${product.price.toLocaleString('en-IN')}`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await api.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Get related products from the same category
  const allInCategory = await api.getProducts({ category: product.categorySlug });
  const relatedProducts = allInCategory.filter((p) => p.id !== product.id);

  const imageUrl = product.image.startsWith('http') ? product.image : `${siteUrl}${product.image}`;
  const images = [imageUrl, ...(product.additionalImages || []).map((img) => (img.startsWith('http') ? img : `${siteUrl}${img}`))];

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description: product.shortDescription || product.fullDescription,
    sku: product.sku || `SRM-${product.id}`,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'Sri Ram & Co',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Sri Ram & Co',
      },
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${siteUrl}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category,
        item: `${siteUrl}/category/${product.categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${siteUrl}/product/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailsClient
        product={product}
        relatedProducts={relatedProducts}
      />
    </>
  );
}
