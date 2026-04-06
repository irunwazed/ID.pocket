import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createSupabaseServer } from '../../../lib/supabaseServer';

// JWT Secret - sebaiknya dari environment variable
const JWT_SECRET = import.meta.env.JWT_SECRET || 'id-flow-secret-key-change-in-production';
const JWT_EXPIRES_IN = '365d'; // 1 tahun

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = createSupabaseServer();
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username dan password wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find user by username
    const { data: user, error } = await supabase
      .from('user')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Username atau password salah' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Username atau password salah' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        name: user.name,
        level: user.level
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data without password and token
    const { password: _, ...userWithoutPassword } = user;

    return new Response(JSON.stringify({
      message: 'Login berhasil',
      token,
      user: userWithoutPassword
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
