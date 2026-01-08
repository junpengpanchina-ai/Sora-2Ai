/**
 * Device Fingerprint Generation
 * 
 * Generates a stable device ID for anti-abuse tracking
 * Uses browser fingerprinting techniques
 */

/**
 * Generate a stable device ID
 * Combines multiple browser characteristics for uniqueness
 */
export function generateDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  const key = 's2ai_device_id_v1';
  
  // Try to get existing device ID
  let deviceId = localStorage.getItem(key);
  if (deviceId) {
    return deviceId;
  }

  // Generate new device ID
  const components: string[] = [];

  // Screen resolution
  if (window.screen) {
    components.push(`${window.screen.width}x${window.screen.height}`);
    components.push(`${window.screen.colorDepth}`);
  }

  // Timezone
  try {
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    // Ignore
  }

  // Language
  components.push(navigator.language || 'unknown');

  // Platform
  components.push(navigator.platform || 'unknown');

  // User agent hash (first 8 chars of hash)
  const ua = navigator.userAgent || '';
  let uaHash = 0;
  for (let i = 0; i < ua.length; i++) {
    uaHash = ((uaHash << 5) - uaHash) + ua.charCodeAt(i);
    uaHash = uaHash & uaHash; // Convert to 32-bit integer
  }
  components.push(Math.abs(uaHash).toString(36).substring(0, 8));

  // Canvas fingerprint (if available)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      const canvasData = canvas.toDataURL();
      // Use first 16 chars of canvas hash
      let canvasHash = 0;
      for (let i = 0; i < Math.min(canvasData.length, 100); i++) {
        canvasHash = ((canvasHash << 5) - canvasHash) + canvasData.charCodeAt(i);
        canvasHash = canvasHash & canvasHash;
      }
      components.push(Math.abs(canvasHash).toString(36).substring(0, 8));
    }
  } catch {
    // Canvas fingerprinting blocked
  }

  // Combine all components
  const combined = components.join('|');
  
  // Generate hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = hash & hash;
  }

  // Create device ID
  deviceId = `dev_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;

  // Store in localStorage
  try {
    localStorage.setItem(key, deviceId);
  } catch {
    // localStorage blocked, use sessionStorage as fallback
    try {
      sessionStorage.setItem(key, deviceId);
    } catch {
      // Both blocked, return without storing
    }
  }

  return deviceId;
}

/**
 * Get existing device ID or generate new one
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  const key = 's2ai_device_id_v1';
  
  // Try localStorage first
  let deviceId = localStorage.getItem(key);
  if (deviceId) {
    return deviceId;
  }

  // Try sessionStorage
  deviceId = sessionStorage.getItem(key);
  if (deviceId) {
    // Upgrade to localStorage if possible
    try {
      localStorage.setItem(key, deviceId);
    } catch {
      // Ignore
    }
    return deviceId;
  }

  // Generate new one
  return generateDeviceId();
}

