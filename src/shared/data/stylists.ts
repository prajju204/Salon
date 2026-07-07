import { Barber } from "@/shared/types/booking";

export const mockStylists: Barber[] = [
  {
    id: 'b1',
    name: 'Alexander Wright',
    role: 'Master Stylist & Barber',
    rating: 4.9,
    completedBookings: 1420,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    skills: ['Fades', 'Scissor Cuts', 'Towel Shaves']
  },
  {
    id: 'b2',
    name: 'Marcus Sterling',
    role: 'Elite Beard Architect',
    rating: 4.8,
    completedBookings: 980,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    skills: ['Beard Sculpting', 'Straight Razor', 'Lineups']
  },
  {
    id: 'b3',
    name: 'David Croft',
    role: 'Senior Grooming Director',
    rating: 5.0,
    completedBookings: 1850,
    image: 'https://images.unsplash.com/photo-1620122303020-43ec4b6cf7f8?w=300&auto=format&fit=crop&q=80',
    skills: ['Classic Cuts', 'Restyling', 'Scalp Therapy']
  },
  {
    id: 'b4',
    name: 'Jordan Vance',
    role: 'Dermatology & Skin Expert',
    rating: 4.7,
    completedBookings: 510,
    image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    skills: ['Facials', 'Detox Treatments', 'Hot Towel Massage']
  }
];
