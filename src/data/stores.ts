import { StoreLocation } from '@/types/store';

export const STORES: StoreLocation[] = [
  {
    id: 'store-trichy',
    name: 'Sriram & Co — Trichy Main Branch',
    city: 'Trichy',
    address: 'No. 11, vinola Complex, Thanjai Main Road, ',
    landmark: 'Near oil Mill Bus stop',
    phone: '+91 93454 03136',
    hours: 'Monday – Saturday: 9:30 AM – 8:30 PM | Sunday: 10:00 AM – 2:00 PM',
    mapUrl: 'https://www.google.com/maps/place/Sri+Ram+%26+Co/@10.8042482,78.7344841,17z/data=!3m1!4b1!4m6!3m5!1s0x3baaf5f2cf051f67:0x4fe03a7c3644b471!8m2!3d10.8042429!4d78.7370644!16s%2Fg%2F11tdrg9m_v?entry=ttu&g_ep=EgoyMDI2MDkzMC4wIKXMDSoASAFQAw%3D%3D',
    isMainStore: true,
  },
  {
    id: 'store-chennai',
    name: 'Sriram & Co — Chennai Experience Store',
    city: 'Chennai',
    address: 'New No. 99/2, Kothaval , Chavadi Street',
    landmark: 'West Saidapat',
    phone: '+91 93454 03136',
    hours: 'Monday – Sunday: 10:00 AM – 9:00 PM',
    mapUrl: 'https://maps.google.com/?q=T+Nagar+Chennai+Usman+Road',
  },
];
