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

/**
 * Extracts the direct image URL from wrapped search engine links or ad redirects.
 * E.g., https://www.google.com/imgres?q=...&imgurl=https%3A%2F%2Fm.media-amazon.com... -> unwraps to https://m.media-amazon.com/...
 * E.g., https://www.google.com/imgres?...&tbnid=ANd9GcR... -> https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR...
 */
export const extractDirectImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl || '';
  const trimmed = rawUrl.trim();

  // Already a data URI or local path
  if (trimmed.startsWith('data:') || trimmed.startsWith('/uploads')) {
    return trimmed;
  }

  // Direct Google thumbnail or user content
  if (trimmed.includes('gstatic.com/images') || trimmed.includes('googleusercontent.com/')) {
    return trimmed;
  }

  try {
    const isGoogle = /google\.[a-z.]+/i.test(trimmed);
    const isBing = /bing\.com/i.test(trimmed);

    if (isGoogle || isBing) {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      
      // 1. Direct image parameters
      const direct = parsed.searchParams.get('imgurl') ||
                     parsed.searchParams.get('imageurl') ||
                     parsed.searchParams.get('image_url') ||
                     parsed.searchParams.get('mediaurl') ||
                     parsed.searchParams.get('media_url') ||
                     parsed.searchParams.get('src');
      if (direct && /^https?:\/\//i.test(direct)) {
        return decodeURIComponent(direct);
      }

      // 2. Google thumbnail ID (tbnid)
      const tbnid = parsed.searchParams.get('tbnid');
      if (tbnid) {
        return `https://encrypted-tbn0.gstatic.com/images?q=tbn:${tbnid}`;
      }

      // 3. Google adurl or redirect url containing direct image
      const adurl = parsed.searchParams.get('adurl') || parsed.searchParams.get('url') || parsed.searchParams.get('q');
      if (adurl) {
        const decodedAdurl = decodeURIComponent(adurl);
        if (/\.(jpeg|jpg|png|webp|gif|svg|avif)(\?.*)?$/i.test(decodedAdurl) || /(?:images|cdn|photo|media)/i.test(decodedAdurl)) {
          return decodedAdurl;
        }
      }
    }
  } catch (e) {
    // URL parsing failed, try regex match fallback
    const imgMatch = trimmed.match(/[?&](?:imgurl|imageurl|image_url|mediaurl)=([^&]+)/i);
    if (imgMatch && imgMatch[1]) {
      return decodeURIComponent(imgMatch[1]);
    }
    const tbnMatch = trimmed.match(/[?&]tbnid=([^&]+)/i);
    if (tbnMatch && tbnMatch[1]) {
      return `https://encrypted-tbn0.gstatic.com/images?q=tbn:${tbnMatch[1]}`;
    }
  }

  return trimmed;
};

export default getApiBase;
