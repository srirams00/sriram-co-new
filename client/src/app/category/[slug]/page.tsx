import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import styles from './category.module.css';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sriramandco.in').replace(/\/+$/, '');

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await api.getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found at Sri Ram & Co.',
    };
  }

  const title = `${category.name} — Appliances & Equipment`;
  const description = `${category.description}. Shop premium ${category.name.toLowerCase()} at Sri Ram & Co with fast delivery and trusted warranty service.`;
  const canonicalUrl = `/category/${category.slug}`;
  const imageUrl = category.image.startsWith('http') ? category.image : `${siteUrl}${category.image}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.name} | Sri Ram & Co`,
      description,
      url: canonicalUrl,
      siteName: 'Sri Ram & Co',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: category.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | Sri Ram & Co`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  // Parallel concurrent fetch to avoid network waterfall
  const [category, products] = await Promise.all([
    api.getCategoryBySlug(slug),
    api.getProducts({ category: slug }),
  ]);

  if (!category) {
    notFound();
  }

  const categoryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Collection`,
    url: `${siteUrl}/category/${category.slug}`,
    description: category.description,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 16).map((product, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${siteUrl}/product/${product.slug}`,
        name: product.name,
      })),
    },
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
        name: category.name,
        item: `${siteUrl}/category/${category.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className={styles.categoryPage}>
      {/* Category Header */}
      <div className={styles.banner}>
        <div className="container">
          <Link href="/shop" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Back to All Products</span>
          </Link>
          <span className="text-eyebrow">Category Collection</span>
          <h1 className="heading-section">{category.name}</h1>
          <p className={styles.bannerDesc}>{category.description}</p>
        </div>
      </div>

      <div className="container">
        <div className={styles.resultsInfo}>
          <span>Showing <strong>{products.length}</strong> items in {category.name}</span>
        </div>

        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No products currently found in this category.</p>
            <Link href="/shop" className="btn btn-primary">
              View All Products
            </Link>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
