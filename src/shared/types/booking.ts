export interface Service {
  id: string;
  _id?: string;
  name: string;
  duration: number; // in minutes
  price: number;
  category: 'Haircuts' | 'Beard' | 'Facials' | 'Packages' | string;
  gender?: 'Male' | 'Female' | 'Both';
  image: string;
  description: string;
  icon?: string;
  status?: string;
}

export interface Barber {
  id: string;
  _id?: string;
  name: string;
  role: string;
  rating: number;
  completedBookings: number;
  image: string;
  skills: string[]; // specialty tags
  activeDays?: number;
  revenue?: number;
  availability?: Record<string, string[]>;
  gender?: string;
}

export interface Appointment {
  id: string;
  _id?: string;
  clientName: string;
  clientEmail: string;
  clientMobile?: string;
  serviceName: string;
  price: number;
  advancePaid?: number;
  remainingBalance?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or format like "09:00 AM"
  barberId: string;
  barberName: string;
  status: 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'Pending' | 'Declined';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id?: string;
  _id?: string;
  clientName: string;
  barberName: string;
  rating: number;
  text: string;
  date: string;
  approved?: boolean;
}
