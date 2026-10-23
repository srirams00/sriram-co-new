import { Category } from '@/types/product';
import { PRODUCTS } from '@/data/products';

function getCategoryProductImage(slug: string, fallback: string): string {
  return PRODUCTS.find((product) => product.categorySlug === slug)?.image ?? fallback;
}

export const CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Cleaning Appliances',
    slug: 'cleaning-appliances',
    description: 'Robotic vacuums, steam mops, and pressure washers',
    image: getCategoryProductImage('cleaning-appliances', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80'),
    itemCount: 14,
  },
  {
    id: 'cat-2',
    name: 'Kitchen Essentials',
    slug: 'kitchen-essentials',
    description: 'Mixer grinders, air fryers, induction cooktops',
    image: getCategoryProductImage('kitchen-essentials', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'),
    itemCount: 14,
  },
  {
    id: 'cat-3',
    name: 'Power Tools',
    slug: 'power-tools',
    description: 'Cordless drills, impact drivers, multi-tools',
    image: getCategoryProductImage('power-tools', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'),
    itemCount: 5,
  },
  {
    id: 'cat-4',
    name: 'Garden & Outdoor',
    slug: 'garden-outdoor',
    description: 'Hose reels, lawn trimmers, pruning shears',
    image: getCategoryProductImage('garden-outdoor', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80'),
    itemCount: 12,
  },
  {
    id: 'cat-5',
    name: 'Personal Care',
    slug: 'personal-care',
    description: 'Grooming kits, hair dryers, massage guns',
    image: getCategoryProductImage('personal-care', 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80'),
    itemCount: 9,
  },
];
