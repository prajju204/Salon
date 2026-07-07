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
    | 'booking_declined';   // Sent to user
  recipient: 'customer' | 'admin' | string; // 'admin' or user ID
  title: string;
  description: string;
  timestamp: string; // E.g., "2h ago", "1 day ago"
  createdAt: string; // ISO string
  read: boolean;
  deepLink?: string;
  status?: 'pending' | 'confirmed' | 'declined' | 'actioned';
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
