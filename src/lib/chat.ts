export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  text: string;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ChatWithToolsResponse {
  text?: string;
  toolCall?: ToolCall;
  error?: string;
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

// export async function chatGemini(
//   messages: ChatMessage[],
//   systemPrompt?: string
// ): Promise<ChatResponse> {
//   const apiKey = import.meta.env.GEMINI_API_KEY;
//   if (!apiKey) return { text: "", error: "GEMINI_API_KEY not set" };

//   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

//   const contents = messages.map((m) => ({
//     role: m.role === "assistant" ? "model" : "user",
//     parts: [{ text: m.content }],
//   }));

//   const body: Record<string, unknown> = { contents };
//   if (systemPrompt) {
//     body.systemInstruction = { parts: [{ text: systemPrompt }] };
//   }

//   try {
//     const res = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//     });

//     const data = await res.json();
//     if (!res.ok) {
//       return { text: "", error: data?.error?.message ?? `HTTP ${res.status}` };
//     }

//     const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//     return { text };
//   } catch (err) {
//     return { text: "", error: String(err) };
//   }
// }
// export async function chatGemini(
//   messages: ChatMessage[],
//   systemPrompt?: string
// ): Promise<ChatResponse> {
//   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
//   if (!apiKey) return { text: "", error: "API Key tidak terbaca" };

//   // 1. Ganti ke Gemini 2.5 Flash sesuai yang tertera di dashboard Rate Limit Anda
//   const modelId = "gemini-2.5-flash"; 
  
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

//   const contents = messages.map((m) => ({
//     role: m.role === "assistant" ? "model" : "user",
//     parts: [{ text: m.content }],
//   }));

//   const body: any = { 
//     contents,
//     generationConfig: {
//       temperature: 0.7,
//       maxOutputTokens: 800, // Batasi agar tidak cepat habis TPM (Tokens Per Minute)
//     }
//   };

//   if (systemPrompt) {
//     body.systemInstruction = { parts: [{ text: systemPrompt }] };
//   }

//   try {
//     const res = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       // Jika error 429, berarti 20 jatah harian Anda sudah habis
//       if (res.status === 429) {
//         return { text: "", error: "Jatah harian (20 request) sudah habis. Coba lagi besok." };
//       }
//       return { text: "", error: data?.error?.message ?? `HTTP ${res.status}` };
//     }

//     const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//     return { text };
//   } catch (err) {
//     return { text: "", error: "Gagal menghubungkan ke server." };
//   }
// }
export async function chatGemini(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ChatResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return { text: "", error: "API Key tidak terbaca" };

  // PERBAIKAN: Gunakan ID model yang sesuai dengan sistem API
  // Prioritas pertama: Gemini 3.1 Flash Lite (500 RPD Anda)
  const modelOptions = [
    "gemini-3.1-flash-lite-preview", // Coba versi preview jika lite standar tidak ditemukan
    "gemini-2.5-flash",             // Fallback ke 2.5 Flash (20 RPD)
    "gemini-1.5-flash"              // Fallback terakhir
  ];

  async function tryFetch(modelId: string) {
    // Pastikan path URL benar: /v1beta/models/{modelId}:generateContent
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    
    const body = {
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined
    };

    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  for (const model of modelOptions) {
    try {
      const res = await tryFetch(model);
      const data = await res.json();

      if (res.ok) {
        return { text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "" };
      }

      // Jika error "not found" (404), lanjut ke model berikutnya di list
      console.warn(`Model ${model} gagal: ${data?.error?.message}`);
      if (res.status === 404 || res.status === 429) continue;

      return { text: "", error: data?.error?.message };
    } catch (err) {
      continue;
    }
  }

  return { text: "", error: "Semua model tidak tersedia atau limit habis." };
}

// ─── Gemini with Tool Calling ─────────────────────────────────────────────────

export async function chatGeminiWithTools(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  systemPrompt?: string
): Promise<ChatWithToolsResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return { error: "API Key tidak terbaca" };

  const modelOptions = ["gemini-2.5-flash", "gemini-1.5-flash"];

  async function tryFetch(modelId: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const body: Record<string, unknown> = {
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      tools: [{ function_declarations: tools }],
    };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  for (const model of modelOptions) {
    try {
      const res = await tryFetch(model);
      const data = await res.json();

      if (!res.ok) {
        console.warn(`Model ${model} gagal: ${data?.error?.message}`);
        if (res.status === 404 || res.status === 429) continue;
        return { error: data?.error?.message };
      }

      const part = data.candidates?.[0]?.content?.parts?.[0];
      if (part?.functionCall) {
        return { toolCall: { name: part.functionCall.name, args: part.functionCall.args ?? {} } };
      }
      return { text: part?.text ?? "" };
    } catch {
      continue;
    }
  }

  return { error: "Semua model tidak tersedia atau limit habis." };
}

// ─── OpenAI with Tool Calling ─────────────────────────────────────────────────

export async function chatOpenAIWithTools(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  systemPrompt?: string,
  model = "gpt-4o-mini"
): Promise<ChatWithToolsResponse> {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) return { error: "OPENAI_API_KEY not set" };

  const systemMessages = systemPrompt ? [{ role: "system", content: systemPrompt }] : [];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [...systemMessages, ...messages],
        tools: tools.map((t) => ({ type: "function", function: t })),
      }),
    });

    const data = await res.json();
    if (!res.ok) return { error: data?.error?.message ?? `HTTP ${res.status}` };

    const choice = data.choices?.[0]?.message;
    if (choice?.tool_calls?.length) {
      const tc = choice.tool_calls[0];
      return {
        toolCall: {
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments ?? "{}"),
        },
      };
    }
    return { text: choice?.content ?? "" };
  } catch (err) {
    return { error: String(err) };
  }
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

export async function chatOpenAI(
  messages: ChatMessage[],
  systemPrompt?: string,
  model = "gpt-4o-mini"
): Promise<ChatResponse> {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) return { text: "", error: "OPENAI_API_KEY not set" };

  const systemMessages = systemPrompt
    ? [{ role: "system", content: systemPrompt }]
    : [];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [...systemMessages, ...messages],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { text: "", error: data?.error?.message ?? `HTTP ${res.status}` };
    }

    const text: string = data.choices?.[0]?.message?.content ?? "";
    return { text };
  } catch (err) {
    return { text: "", error: String(err) };
  }
}

// ─── Claude (Anthropic) ───────────────────────────────────────────────────────

export async function chatClaude(
  messages: ChatMessage[],
  systemPrompt?: string,
  model = "claude-haiku-4-5-20251001"
): Promise<ChatResponse> {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { text: "", error: "ANTHROPIC_API_KEY not set" };

  const body: Record<string, unknown> = {
    model,
    max_tokens: 1024,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (systemPrompt) body.system = systemPrompt;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return { text: "", error: data?.error?.message ?? `HTTP ${res.status}` };

    const text: string = data.content?.[0]?.text ?? "";
    return { text };
  } catch (err) {
    return { text: "", error: String(err) };
  }
}

export async function chatClaudeWithTools(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  systemPrompt?: string,
  model = "claude-haiku-4-5-20251001"
): Promise<ChatWithToolsResponse> {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "ANTHROPIC_API_KEY not set" };

  const body: Record<string, unknown> = {
    model,
    max_tokens: 1024,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    })),
  };
  if (systemPrompt) body.system = systemPrompt;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return { error: data?.error?.message ?? `HTTP ${res.status}` };

    const block = data.content?.[0];
    if (block?.type === "tool_use") {
      return { toolCall: { name: block.name, args: block.input ?? {} } };
    }
    return { text: block?.text ?? "" };
  } catch (err) {
    return { error: String(err) };
  }
}

// ─── OpenCode (opencode.ai/zen — OpenAI-compatible) ──────────────────────────
// Docs: https://opencode.ai | Endpoint: https://opencode.ai/zen/v1
// Auth: Authorization: Bearer <OPENCODE_API_KEY>
// Available models: claude-haiku-4-5, claude-sonnet-4-6, gemini-3-flash, kimi-k2.5, etc.

const OPENCODE_BASE = "https://opencode.ai/zen/v1";

export async function chatOpenCode(
  messages: ChatMessage[],
  systemPrompt?: string,
  model = "minimax-m2.5-free"
): Promise<ChatResponse> {
  const apiKey = import.meta.env.OPENCODE_API_KEY;
  if (!apiKey) return { text: "", error: "OPENCODE_API_KEY not set" };

  const baseUrl = import.meta.env.OPENCODE_BASE_URL || OPENCODE_BASE;
  const systemMessages = systemPrompt ? [{ role: "system", content: systemPrompt }] : [];

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: [...systemMessages, ...messages] }),
    });

    const data = await res.json();
    if (!res.ok) return { text: "", error: data?.error?.message ?? `HTTP ${res.status}` };

    const text: string = data.choices?.[0]?.message?.content ?? "";
    return { text };
  } catch (err) {
    return { text: "", error: String(err) };
  }
}

export async function chatOpenCodeWithTools(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  systemPrompt?: string,
  model = "minimax-m2.5-free"
): Promise<ChatWithToolsResponse> {
  const apiKey = import.meta.env.OPENCODE_API_KEY;
  if (!apiKey) return { error: "OPENCODE_API_KEY not set" };

  const baseUrl = import.meta.env.OPENCODE_BASE_URL || OPENCODE_BASE;
  const systemMessages = systemPrompt ? [{ role: "system", content: systemPrompt }] : [];

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [...systemMessages, ...messages],
        tools: tools.map((t) => ({ type: "function", function: t })),
      }),
    });

    const data = await res.json();
    if (!res.ok) return { error: data?.error?.message ?? `HTTP ${res.status}` };

    const choice = data.choices?.[0]?.message;
    if (choice?.tool_calls?.length) {
      const tc = choice.tool_calls[0];
      return { toolCall: { name: tc.function.name, args: JSON.parse(tc.function.arguments ?? "{}") } };
    }
    return { text: choice?.content ?? "" };
  } catch (err) {
    return { error: String(err) };
  }
}
