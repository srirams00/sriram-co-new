import { Category } from '@/types/product';

export const CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Cleaning Appliances',
    slug: 'cleaning-appliances',
    description: 'Robotic vacuums, steam mops, and pressure washers',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80',
    itemCount: 18,
  },
  {
    id: 'cat-2',
    name: 'Kitchen Essentials',
    slug: 'kitchen-essentials',
    description: 'Mixer grinders, air fryers, induction cooktops',
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80',
    itemCount: 24,
  },
  {
    id: 'cat-3',
    name: 'Power Tools',
    slug: 'power-tools',
    description: 'Cordless drills, impact drivers, multi-tools',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    itemCount: 15,
  },
  {
    id: 'cat-4',
    name: 'Garden & Outdoor',
    slug: 'garden-outdoor',
    description: 'Hose reels, lawn trimmers, pruning shears',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    itemCount: 12,
  },
  {
    id: 'cat-5',
    name: 'Personal Care',
    slug: 'personal-care',
    description: 'Grooming kits, hair dryers, massage guns',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    itemCount: 10,
  },
];
