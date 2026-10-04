export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  location: string;
  customerType: string;
  rating?: number;
  productMentioned?: string;
}
