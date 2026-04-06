import { defineMiddleware } from 'astro:middleware';
import { getTokenFromCookie, verifyToken } from './lib/auth';

// Paths that don't require authentication
const publicPaths = ['/login', '/register', '/api/auth/login'];

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = new URL(context.request.url);

  // Allow public paths and API requests
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  const isApiPath = pathname.startsWith('/api/');

  if (isPublicPath || isApiPath) {
    return next();
  }

  // Check for auth token
  const token = getTokenFromCookie(context.request);
  const user = token ? verifyToken(token) : null;

  // Redirect to login if not authenticated
  if (!user) {
    return context.redirect('/login');
  }

  // Attach user to locals for use in components
  context.locals.user = user;

  return next();
});

// Ensure the middleware type is correct
type MiddlewareProps = {
  locals: {
    user?: {
      userId: number;
      username: string;
      name: string;
      level?: number;
    } | null;
  };
};

declare module 'astro' {
  interface Locals extends MiddlewareProps['locals'] {}
}
