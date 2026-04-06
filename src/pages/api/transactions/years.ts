import type { APIRoute } from 'astro';
import { createSupabaseServer } from '../../../lib/supabaseServer';

export const GET: APIRoute = async () => {
  try {
    const supabase = createSupabaseServer();

    const { data, error } = await supabase
      .from('transaction')
      .select('year')
      .is('deleted_at', null)
      .order('year', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get unique years
    const yearsSet = new Set<number>();
    (data || []).forEach((t: any) => {
      if (t.year) yearsSet.add(t.year);
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);

    return new Response(JSON.stringify({ years }), {
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
