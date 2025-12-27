/**
 * Utility functions for JWT token handling
 */

export interface JWTPayload {
  exp?: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at time
  sub?: string; // Subject (user ID)
  [key: string]: any; // Other claims
}

/**
 * Decode JWT token without verification (client-side only)
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64 payload (second part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired or will expire soon
 * @param token JWT token string
 * @param bufferSeconds Number of seconds before expiration to consider as "expiring soon" (default: 300 = 5 minutes)
 * @returns true if token is expired or expiring soon
 */
export function isTokenExpiringSoon(token: string, bufferSeconds: number = 300): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true; // If we can't decode or no exp claim, consider it expired
  }

  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return expirationTime - currentTime <= bufferTime;
}

/**
 * Get time until token expiration in milliseconds
 * @param token JWT token string
 * @returns Milliseconds until expiration, or 0 if expired/invalid
 */
export function getTimeUntilExpiration(token: string): number {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const timeUntilExpiration = expirationTime - currentTime;

  return Math.max(0, timeUntilExpiration);
}

