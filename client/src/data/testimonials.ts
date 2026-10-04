import { Testimonial } from '@/types/testimonial';

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    quote: '"My mixer stopped working one day after the warranty ran out. I called the shop expecting nothing — they sent a technician to my home the very next day and replaced the coupler for free. That is why my whole family buys from Sriram & Co."',
    author: 'Kavitha Saravanan',
    location: 'Thillai Nagar, Trichy',
    customerType: 'Verified Customer',
    rating: 5,
    productMentioned: 'Commercial Duty 750W Mixer Grinder',
  },
  {
    id: 'test-2',
    quote: '"Ordered a wet and dry vacuum cleaner on Sunday morning. It was on my doorstep that same evening. No delivery aggregators playing games with time slots, just real store people providing direct assistance."',
    author: 'Ravi Chandran',
    location: 'Anna Nagar, Chennai',
    customerType: 'Verified Homeowner',
    rating: 5,
    productMentioned: 'Wet & Dry Industrial Vacuum Cleaner 20L',
  },
  {
    id: 'test-3',
    quote: '"They told me NOT to buy the costliest 24V drill because it was overkill for my home woodwork. Saved me ₹3,000! Genuine advice like this is why they have been running for 35 years."',
    author: 'M. Sridhar',
    location: 'K.K. Nagar, Trichy',
    customerType: 'Verified DIYer',
    rating: 5,
    productMentioned: '18V Cordless Brushless Drill Kit',
  },
];
