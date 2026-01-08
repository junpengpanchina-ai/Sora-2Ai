/**
 * IP Address Utilities
 * 
 * Functions for extracting and hashing IP addresses
 */

/**
 * Extract IP address from request headers
 * Checks common proxy headers (Cloudflare, Vercel, etc.)
 */
export function extractClientIp(request: Request): string | null {
  // Check common proxy headers (in order of preference)
  const headers = request.headers;
  
  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Vercel
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0) {
      return ips[0];
    }
  }

  // Standard headers
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  const xClientIp = headers.get('x-client-ip');
  if (xClientIp) {
    return xClientIp;
  }

  return null;
}

/**
 * Get IP prefix (/24 CIDR) for risk tracking
 * Example: 192.168.1.100 -> 192.168.1.0
 */
export function getIpPrefix(ip: string): string | null {
  if (!ip) {
    return null;
  }

  // IPv4
  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    return `${ipv4Match[1]}.${ipv4Match[2]}.${ipv4Match[3]}.0/24`;
  }

  // IPv6 (simplified - take first 64 bits)
  const ipv6Match = ip.match(/^([0-9a-fA-F:]+)::/);
  if (ipv6Match) {
    return `${ipv6Match[1]}::/64`;
  }

  return null;
}

/**
 * Hash IP address for privacy (SHA-256, first 16 chars)
 * Returns null if crypto API not available
 */
export async function hashIp(ip: string): Promise<string | null> {
  if (!ip || typeof window === 'undefined') {
    // Server-side: use simple hash
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ((hash << 5) - hash) + ip.charCodeAt(i);
      hash = hash & hash;
    }
    return `ip_${Math.abs(hash).toString(36)}`;
  }

  // Client-side: use Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(ip);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.substring(0, 16); // First 16 chars
    } catch {
      // Fallback to simple hash
    }
  }

  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash = hash & hash;
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}

/**
 * Server-side IP hash (synchronous)
 */
export function hashIpSync(ip: string): string {
  if (!ip) {
    return 'unknown';
  }

  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash = hash & hash;
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}

