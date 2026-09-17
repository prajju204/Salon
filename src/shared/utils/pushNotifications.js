import axios from 'axios';
import { API_BASE } from './api';

const VAPID_PUBLIC_KEY = 'BB_E1FqXsPuTyAV_LNLimNhDL1AFK621BhtdMi9F68DRr4ZRKaOEPk5ucV9ewMnjXMe0b6_IH6kmV2I7R--Wkxc';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeUserToPush = async (role) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications are not supported by the browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully:', registration);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push notification permission denied.');
      return;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      console.log('User subscribed to push:', subscription);
    } else {
      console.log('User already subscribed:', subscription);
    }

    // Send subscription to backend
    await axios.post(`${API_BASE}/api/notifications/subscribe`, {
      subscription: subscription,
      role: role
    });
    console.log('Push subscription saved to server.');
  } catch (err) {
    console.error('Error during push subscription:', err);
  }
};
