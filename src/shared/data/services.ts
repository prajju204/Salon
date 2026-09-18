import { Service } from "@/shared/types/booking";

export const mockServices: Service[] = [
  {
    id: 's1',
    name: 'Executive Scissor Cut',
    duration: 45,
    price: 1200,
    category: 'Haircuts',
    gender: 'Male',
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
    gender: 'Male',
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
    gender: 'Male',
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
    gender: 'Male',
    icon: 'face',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80',
    description: 'Sculpting and trimming with straight-razor detailing, infused with premium gold argan oils.'
  },
  {
    id: 's5',
    name: 'Classic Hot Towel Shave',
    duration: 45,
    price: 950,
    category: 'Beard',
    gender: 'Male',
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
    gender: 'Both',
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
    gender: 'Both',
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
    gender: 'Both',
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
    gender: 'Male',
    icon: 'celebration',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
    description: 'Our finest package. Executive Scissor Cut, Hot Towel Shave, Gold Brightening Facial, and hair treatment.'
  },
  {
    id: 's10',
    name: 'Women\'s Layered Cut & Blowdry',
    duration: 60,
    price: 1600,
    category: 'Haircuts',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80',
    description: 'Precision layered haircut customized for volume and flow, complete with luxury wash, conditioning, and blowout.'
  },
  {
    id: 's11',
    name: 'Glamour Hydra Facial & Spa',
    duration: 60,
    price: 2500,
    category: 'Facials',
    gender: 'Female',
    icon: 'spa',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&auto=format&fit=crop&q=80',
    description: 'Advanced hydrating facial using botanical extracts and collagen boosting therapy for soft, luminous skin.'
  },
  {
    id: 's12',
    name: 'Luxe Silk Keratin Smoothing Package',
    duration: 100,
    price: 3800,
    category: 'Packages',
    gender: 'Female',
    icon: 'celebration',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    description: 'Comprehensive restorative keratin treatment for smooth, frizz-free, shiny hair with intense nourishment.'
  },
  {
    id: 's13',
    name: 'Classic Ponytail',
    duration: 30,
    price: 800,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&auto=format&fit=crop&q=80',
    description: 'Sleek and timeless classic ponytail styled for smooth, polished elegance.'
  },
  {
    id: 's14',
    name: 'Loose Waves',
    duration: 45,
    price: 1200,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    description: 'Soft, effortless loose waves providing natural volume and romantic texture.'
  },
  {
    id: 's15',
    name: 'Messy Bun',
    duration: 35,
    price: 900,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&auto=format&fit=crop&q=80',
    description: 'Chic and casual messy updo crafted with face-framing tendrils.'
  },
  {
    id: 's16',
    name: 'Three-Strand Braid',
    duration: 30,
    price: 700,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&auto=format&fit=crop&q=80',
    description: 'Traditional neat or textured three-strand braided style for a sophisticated finish.'
  },
  {
    id: 's17',
    name: 'Pixie Cut',
    duration: 45,
    price: 1400,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80',
    description: 'Bold, short pixie cut precision tailored to accentuate facial features.'
  },
  {
    id: 's18',
    name: 'Blunt Bob',
    duration: 50,
    price: 1500,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1605497746444-ac9dbd3d4401?w=600&auto=format&fit=crop&q=80',
    description: 'Sharp, modern blunt bob cut with clean edges and smooth styling finish.'
  },
  {
    id: 's19',
    name: 'Textured Lob',
    duration: 50,
    price: 1600,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80',
    description: 'Shoulder-length textured long bob (lob) filled with movement and dimension.'
  }
];
