export interface WaitlistEntry {
  id: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  date: string; // YYYY-MM-DD
  timeWindowPreference: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Any';
  position: number;
  notificationPreferences: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  createdAt: string; // ISO string
}
