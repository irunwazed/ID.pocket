/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly OPENAI_API_KEY: string;
  readonly ANTHROPIC_API_KEY: string;
  readonly OPENCODE_API_KEY: string;
  readonly OPENCODE_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
