import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({ message: 'Logout berhasil' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Clear the auth_token cookie
        'Set-Cookie': 'auth_token=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
