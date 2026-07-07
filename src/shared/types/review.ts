export interface StylistReview {
  id: string;
  clientName: string;
  clientAvatar?: string;
  barberName: string;
  rating: number; // overall
  ratingsDetail?: {
    serviceQuality: number;
    stylist: number;
    cleanliness: number;
  };
  text: string;
  date: string;
  serviceTag?: string;
  images?: string[];
  approved?: boolean;
}
