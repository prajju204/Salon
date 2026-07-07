import { Service } from "@/shared/types/booking";

export const mockServices: Service[] = [
  {
    id: 's1',
    name: 'Executive Scissor Cut',
    duration: 45,
    price: 1200,
    category: 'Haircuts',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80',
    description: 'A tailored cut using classic scissor techniques, followed by a premium wash, scalp massage, and styling.'
  },
  {
    id: 's2',
    name: 'Signature Skin Fade',
    duration: 40,
    price: 1000,
    category: 'Haircuts',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80',
    description: 'Ultra-precise clipper fade transitioning down to the skin, styled with premium gold pomade.'
  },
  {
    id: 's3',
    name: 'Luxe Buzz Cut & Lineup',
    duration: 25,
    price: 600,
    category: 'Haircuts',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
    description: 'Single-length clipper trim with clean razor edge outline and custom neck shave.'
  },
  {
    id: 's4',
    name: 'Royal Beard Detail',
    duration: 30,
    price: 800,
    category: 'Beard',
    icon: 'face',
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80',
    description: 'Sculpting and trimming with straight-razor detailing, infused with premium gold argan oils.'
  },
  {
    id: 's5',
    name: 'Classic Hot Towel Shave',
    duration: 45,
    price: 950,
    category: 'Beard',
    icon: 'face',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
    description: 'Multi-step ritual including warm essential oil prep, rich lathering, straight razor shave, and cooling facial lotion.'
  },
  {
    id: 's6',
    name: 'Charcoal Detox Facial',
    duration: 35,
    price: 1500,
    category: 'Facials',
    icon: 'spa',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&auto=format&fit=crop&q=80',
    description: 'Deep cleansing treatment using activated charcoal mask to remove impurities and refresh the skin.'
  },
  {
    id: 's7',
    name: 'Gold Brightening Facial',
    duration: 50,
    price: 2200,
    category: 'Facials',
    icon: 'spa',
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&auto=format&fit=crop&q=80',
    description: 'Premium facial treatment utilizing luxury gold-leaf masks and anti-aging serum massage for a glowing complexion.'
  },
  {
    id: 's8',
    name: 'The Luxe Ritual Package',
    duration: 90,
    price: 3200,
    category: 'Packages',
    icon: 'celebration',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80',
    description: 'The ultimate package: Executive Scissor Cut, Royal Beard Detail, and charcoal mask detox.'
  },
  {
    id: 's9',
    name: 'The Groom\'s Privilege',
    duration: 120,
    price: 4500,
    category: 'Packages',
    icon: 'celebration',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
    description: 'Our finest package. Executive Scissor Cut, Hot Towel Shave, Gold Brightening Facial, and hair treatment.'
  }
];
