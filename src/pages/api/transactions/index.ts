import type { APIRoute } from 'astro';
import { createSupabaseServer } from '../../../lib/supabaseServer';

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabase = createSupabaseServer();

    // Get pagination params
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    const page = Math.max(1, parseInt(pageParam || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || '10')));
    const offset = (page - 1) * limit;

    // Get filter params
    const codeTypeParam = url.searchParams.get('code_type');
    const noteParam = url.searchParams.get('note');
    const yearParam = url.searchParams.get('year');
    const monthParam = url.searchParams.get('month');

    // Build query with filters
    let query = supabase
      .from('transaction')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (codeTypeParam) {
      query = query.eq('code_type', codeTypeParam);
    }
    if (noteParam) {
      query = query.ilike('note', `%${noteParam}%`);
    }
    if (yearParam) {
      query = query.eq('year', parseInt(yearParam));
    }
    if (monthParam) {
      query = query.eq('month', parseInt(monthParam));
    }

    // Get total count with filters
    const { count, error: countError } = await query;

    if (countError) {
      return new Response(JSON.stringify({ error: countError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated data with filters
    let dataQuery = supabase
      .from('transaction')
      .select('*')
      .is('deleted_at', null);

    if (codeTypeParam) {
      dataQuery = dataQuery.eq('code_type', codeTypeParam);
    }
    if (noteParam) {
      dataQuery = dataQuery.ilike('note', `%${noteParam}%`);
    }
    if (yearParam) {
      dataQuery = dataQuery.eq('year', parseInt(yearParam));
    }
    if (monthParam) {
      dataQuery = dataQuery.eq('month', parseInt(monthParam));
    }

    const { data, error } = await dataQuery
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      data: data || [],
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = createSupabaseServer();
    const body = await request.json();

    // Add created_at if not provided
    const transactionData = {
      ...body,
      created_at: body.created_at || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('transaction')
      .insert(transactionData)
      .select()
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
