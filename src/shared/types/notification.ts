export interface LuxeNotification {
  id: string;
  type: 
    | 'booking_confirmed' 
    | 'reminder_24h' 
    | 'reminder_1h' 
    | 'promo' 
    | 'review_request' 
    | 'waitlist_open'
    | 'booking_request'     // Sent to admin
    | 'booking_pending'     // Sent to user
    | 'booking_declined'    // Sent to user
    | 'cancellation'
    | 'reschedule'
    | 'new_booking'
    | 'info'
    | string;               // allow any backend-generated types
  recipient: 'customer' | 'admin' | string;
  recipientRole?: 'customer' | 'admin' | string; // Legacy fallback field from DB
  title: string;
  description: string;
  timestamp: string;
  createdAt: string; // ISO string
  read: boolean;
  deepLink?: string;
  status?: 'pending' | 'confirmed' | 'declined' | 'actioned';
  bookingDetails?: {
    _id?: string;
    clientName?: string;
    clientEmail?: string;
    serviceName?: string;
    barberName?: string;
    date?: string;
    time?: string;
    price?: number;
    status?: string;
    notes?: string;
  } | null;
  bookingPayload?: {
    bookingId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    serviceName: string;
    stylistName: string;
    date: string;
    time: string;
    price: number;
    notes?: string;
    reason?: string;
  };
}
