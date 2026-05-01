import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { chatGeminiWithTools, chatOpenAIWithTools, chatClaudeWithTools, chatOpenCodeWithTools } from '../../../lib/chat';
import type { ToolDefinition } from '../../../lib/chat';
import { getAuthUser } from '../../../lib/auth';
import { createSupabaseServer } from '../../../lib/supabaseServer';

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider: string;
  username?: string;
  isError?: boolean;
}

const historyPath = path.join(process.cwd(), 'data', 'chat-history.json');

function readHistory(): ChatEntry[] {
  try {
    if (!fs.existsSync(historyPath)) return [];
    return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeHistory(entries: ChatEntry[]) {
  const dir = path.dirname(historyPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(historyPath, JSON.stringify(entries, null, 2));
}

export const GET: APIRoute = async ({ request }) => {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(readHistory()), {
    headers: { 'Content-Type': 'application/json' },
  });
};


export const POST: APIRoute = async ({ request }) => {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { message, provider = 'gemini', history = [] } = body;


  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Pesan tidak boleh kosong' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userEntry: ChatEntry = {
    id: crypto.randomUUID(),
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
    provider,
    username: authUser.username,
  };

  const messages = [...history, { role: 'user' as const, content: message }];

  // Fetch available transaction types for AI context
  const supabase = createSupabaseServer();
  const { data: types } = await supabase.from('type').select('*').order('id');
  const typeList = (types ?? [])
    .map((t: { code_type?: string; name?: string }) => `${t.code_type} (${t.name})`)
    .join(', ');

  const now = new Date();
  const systemPrompt = `Kamu adalah asisten keuangan pribadi yang membantu mencatat dan menganalisis keuangan.
Jawab dalam bahasa Indonesia secara singkat dan ramah.
Gunakan tool simpan_transaksi HANYA ketika pengguna secara eksplisit meminta mencatat, inputkan, isikan, atau masukkan transaksi.
Untuk pertanyaan atau percakapan biasa, jawab secara normal tanpa menggunakan tool.
Daftar tipe transaksi: ${typeList}.
Default bulan: ${now.getMonth() + 1}, tahun: ${now.getFullYear()} jika tidak disebutkan.`;

  const tool: ToolDefinition = {
    name: 'simpan_transaksi',
    description: 'Simpan transaksi keuangan ke database. Panggil hanya ketika pengguna eksplisit meminta mencatat/inputkan/memasukkan transaksi.',
    parameters: {
      type: 'object',
      properties: {
        note:      { type: 'string', description: 'Deskripsi transaksi' },
        money:     { type: 'number', description: 'Jumlah uang dalam rupiah (angka saja)' },
        code_type: { type: 'string', description: `Kode tipe transaksi, pilih dari: ${typeList}` },
        month:     { type: 'number', description: 'Bulan 1-12' },
        year:      { type: 'number', description: 'Tahun, contoh 2025' },
      },
      required: ['note', 'money', 'code_type'],
    },
  };

  const result =
    provider === 'openai'     ? await chatOpenAIWithTools(messages, [tool], systemPrompt) :
    provider === 'claude'     ? await chatClaudeWithTools(messages, [tool], systemPrompt) :
    provider === 'opencode'   ? await chatOpenCodeWithTools(messages, [tool], systemPrompt) :
                                await chatGeminiWithTools(messages, [tool], systemPrompt);

  // ── Error from AI ──
  if (result.error) {
    const assistantEntry: ChatEntry = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.error,
      timestamp: now.toISOString(),
      provider,
      isError: true,
    };
    writeHistory([...readHistory(), userEntry, assistantEntry]);
    return new Response(
      JSON.stringify({ reply: result.error, userEntry, assistantEntry }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Tool call: insert transaction ──
  if (result.toolCall?.name === 'simpan_transaksi') {
    const args = result.toolCall.args as {
      note: string; money: number; code_type: string; month?: number; year?: number;
    };

    const { data: txData, error: txError } = await supabase
      .from('transaction')
      .insert({
        note: args.note,
        money: args.money,
        code_type: args.code_type,
        month: args.month ?? now.getMonth() + 1,
        year: args.year ?? now.getFullYear(),
        created_at: now.toISOString(),
        created_by: authUser.username,
      })
      .select()
      .single();

    const replyText = txError
      ? `Gagal menyimpan transaksi: ${txError.message}`
      : `Transaksi dicatat! ✓ ${args.note} — Rp ${Number(args.money).toLocaleString('id-ID')}`;

    const assistantEntry: ChatEntry = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: replyText,
      timestamp: now.toISOString(),
      provider,
      isError: !!txError,
    };

    writeHistory([...readHistory(), userEntry, assistantEntry]);
    return new Response(
      JSON.stringify({ reply: replyText, userEntry, assistantEntry, transaction: txData ?? null }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Normal chat response ──
  const assistantEntry: ChatEntry = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: result.text ?? '',
    timestamp: now.toISOString(),
    provider,
  };

  writeHistory([...readHistory(), userEntry, assistantEntry]);
  return new Response(
    JSON.stringify({ reply: assistantEntry.content, userEntry, assistantEntry }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

export const DELETE: APIRoute = async ({ request }) => {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  writeHistory([]);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
