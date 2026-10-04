import React from 'react';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import ProductDetailsClient from '@/components/products/ProductDetailsClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
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

  return (
    <ProductDetailsClient
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
