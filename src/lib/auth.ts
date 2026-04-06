import type { APIContext } from 'astro';
import jwt from 'jsonwebtoken';

const JWT_SECRET = import.meta.env.JWT_SECRET || 'id-flow-secret-key-change-in-production';

export interface AuthUser {
  userId: number;
  username: string;
  name: string;
  level?: number;
}

// Verify JWT token and return decoded user data
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (err) {
    return null;
  }
}

// Get token from cookie
export function getTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith('auth_token='));

  if (!authCookie) return null;

  return authCookie.split('=')[1];
}

// Astro middleware to check authentication
export async function checkAuth(context: APIContext): Promise<AuthUser | null> {
  const token = getTokenFromCookie(context.request);

  if (!token) return null;

  return verifyToken(token);
}

// Get token from Authorization header (Bearer token)
export function getTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

// Get authenticated user from either cookie or header
export function getAuthUser(request: Request): AuthUser | null {
  // Try header first (for API calls with Bearer token)
  const tokenFromHeader = getTokenFromHeader(request);
  if (tokenFromHeader) {
    return verifyToken(tokenFromHeader);
  }

  // Fallback to cookie
  const tokenFromCookie = getTokenFromCookie(request);
  if (tokenFromCookie) {
    return verifyToken(tokenFromCookie);
  }

  return null;
}
