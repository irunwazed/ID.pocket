import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { createSupabaseServer } from '../../../lib/supabaseServer';

export const GET: APIRoute = async () => {
  try {
    const supabase = createSupabaseServer();

    const { data, error } = await supabase
      .from('user')
      .select('id, created_at, name, username, level')
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = createSupabaseServer();
    const body = await request.json();

    if (!body.password) {
      return new Response(JSON.stringify({ error: 'Password wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const { data, error } = await supabase
      .from('user')
      .insert({
        name: body.name,
        username: body.username,
        password: hashedPassword,
        level: body.level
      })
      .select('id, created_at, name, username, level')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
