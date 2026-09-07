/**
 * Utility helper to get the API base URL.
 * In development (localhost/127.0.0.1), uses http://localhost:5000 unless overridden by VITE_API_URL.
 * In production (e.g. Vercel deployment), uses window.location.origin unless overridden by VITE_API_URL.
 */
export const getApiBase = () => {
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const API_BASE = getApiBase();
export const API_URL = `${getApiBase()}/api`;

export default getApiBase;
