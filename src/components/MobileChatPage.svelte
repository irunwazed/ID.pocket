<script lang="ts">
  import { onMount } from 'svelte';
  import { chatApi } from '../lib/api';
  import type { ChatHistoryEntry } from '../lib/api';

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  let chatHistory: ChatHistoryEntry[] = $state([]);
  let chatInput = $state('');
  let chatLoading = $state(false);
  let chatError: string | null = $state(null);
  let chatProvider = $state('opencode');
  let isRecording = $state(false);
  let isTranscribing = $state(false);
  let modelLoadProgress = $state<string | null>(null);
  let audioLevels = $state<number[]>(Array(14).fill(0));
  let chatContainerEl: HTMLDivElement | undefined = $state(undefined);
  let textareaEl = $state<HTMLTextAreaElement | null>(null);
  let mediaStream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;
  let animFrameId: number | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let transcriber: any = null; // Whisper pipeline (lazy-loaded)

  // Config sidebar
  let showConfig = $state(false);
  let micDevices = $state<MediaDeviceInfo[]>([]);
  let selectedMicId = $state('default');

  const providers = [
    { id: 'gemini',   label: 'Gemini',   desc: 'Google Gemini Flash' },
    { id: 'claude',   label: 'Claude',   desc: 'Anthropic Haiku' },
    { id: 'openai',   label: 'OpenAI',   desc: 'GPT-4o Mini' },
    { id: 'opencode', label: 'OpenCode', desc: 'opencode.ai/zen' },
  ];

  async function loadMicDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const all = await navigator.mediaDevices.enumerateDevices();
      micDevices = all.filter(d => d.kind === 'audioinput');
    } catch {
      micDevices = [];
    }
  }

  async function openConfig() {
    showConfig = true;
    await loadMicDevices();
  }

  // Auto-resize textarea when chatInput changes (including from voice)
  $effect(() => {
    chatInput;
    if (textareaEl) {
      textareaEl.style.height = 'auto';
      textareaEl.style.height = Math.min(textareaEl.scrollHeight, 120) + 'px';
    }
  });

  function stopViz() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    mediaStream?.getTracks().forEach(t => t.stop());
    mediaStream = null;
    audioCtx?.close().catch(() => {});
    audioCtx = null;
    audioLevels = Array(14).fill(0);
  }

  function scrollToBottom() {
    setTimeout(() => { if (chatContainerEl) chatContainerEl.scrollTop = chatContainerEl.scrollHeight; }, 50);
  }

  function formatTime(ts: string): string {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  async function loadHistory() {
    try {
      chatHistory = await chatApi.getHistory();
      scrollToBottom();
    } catch (err: any) {
      chatError = err.message || 'Gagal memuat riwayat';
    }
  }

  async function sendMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const message = chatInput.trim();
    chatInput = '';
    chatLoading = true;
    const tempId = 'temp-' + Date.now();
    chatHistory = [...chatHistory, { id: tempId, role: 'user', content: message, timestamp: new Date().toISOString(), provider: chatProvider }];
    scrollToBottom();
 
    try {
      const historyForApi = chatHistory.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      
      const result = await chatApi.send(message, chatProvider, historyForApi);
      
      chatHistory = chatHistory.filter(m => m.id !== tempId);
      chatHistory = [...chatHistory, result.userEntry, result.assistantEntry];
      scrollToBottom();
    } catch (err: any) {
      chatHistory = chatHistory.map(m => m.id === tempId ? { ...m, id: 'local-' + Date.now() } : m);
      chatHistory = [...chatHistory, {
        id: 'err-' + Date.now(),
        role: 'assistant' as const,
        content: err.message || 'Gagal mengirim pesan',
        timestamp: new Date().toISOString(),
        provider: chatProvider,
        isError: true,
      }];
      scrollToBottom();
    } finally {
      chatLoading = false;
    }
  }

  async function clearChat() {
    if (!confirm('Hapus semua riwayat chat?')) return;
    try {
      await chatApi.clearHistory();
      chatHistory = [];
    } catch (err: any) {
      chatError = err.message;
    }
  }

  async function loadTranscriber() {
    if (transcriber) return transcriber;
    modelLoadProgress = 'Memuat model Whisper...';
    try {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.allowLocalModels = false; // always fetch from HF Hub
      transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',
        {
          dtype: 'fp32',     // avoid int4/MatMulNBits incompatibility in onnxruntime-web
          device: 'wasm',
          progress_callback: (p: any) => {
            if (p.status === 'progress' && p.progress != null) {
              modelLoadProgress = `Download model: ${Math.round(p.progress)}%`;
            } else if (p.status === 'ready' || p.status === 'done') {
              modelLoadProgress = null;
            }
          },
        } as any
      );
      modelLoadProgress = null;
      return transcriber;
    } catch (err: any) {
      modelLoadProgress = null;
      throw new Error(`Gagal load model: ${err?.message ?? err}`);
    }
  }

  async function blobToFloat32(blob: Blob): Promise<Float32Array> {
    const arrayBuffer = await blob.arrayBuffer();
    // Whisper expects 16kHz mono Float32
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    let data: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      data = audioBuffer.getChannelData(0).slice();
    } else {
      // mix down to mono
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      data = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) data[i] = (left[i] + right[i]) / 2;
    }
    ctx.close().catch(() => {});
    return data;
  }

  async function toggleVoice() {
    if (isRecording) {
      // stop recording → triggers onstop → transcribe
      isRecording = false;
      mediaRecorder?.stop();
      return;
    }

    if (isTranscribing) return;
    chatError = null;

    try {
      const audioConstraint = selectedMicId && selectedMicId !== 'default'
        ? { deviceId: { exact: selectedMicId } }
        : true;
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint });
    } catch (err: any) {
      chatError = `Tidak bisa akses mikrofon: ${err?.message ?? err}`;
      return;
    }

    // start waveform from same stream
    startVizFromStream(mediaStream);

    recordedChunks = [];
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    mediaRecorder = mime ? new MediaRecorder(mediaStream, { mimeType: mime }) : new MediaRecorder(mediaStream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stopViz();
      const blob = new Blob(recordedChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
      recordedChunks = [];
      if (blob.size < 500) {
        chatError = 'Suara terlalu pendek';
        return;
      }

      isTranscribing = true;
      try {
        const t = await loadTranscriber();
        const audioData = await blobToFloat32(blob);
        modelLoadProgress = 'Transkripsi...';
        const result = await t(audioData, {
          language: 'indonesian',
          task: 'transcribe',
          chunk_length_s: 30,
          stride_length_s: 5,
        });
        const text = (result?.text ?? '').trim();
        if (text) {
          chatInput = chatInput.trim() ? `${chatInput.trim()} ${text}` : text;
        } else {
          chatError = 'Tidak ada teks terdeteksi';
        }
      } catch (err: any) {
        chatError = err?.message ?? 'Transkripsi gagal';
      } finally {
        isTranscribing = false;
        modelLoadProgress = null;
      }
    };

    mediaRecorder.start();
    isRecording = true;
  }

  function startVizFromStream(stream: MediaStream) {
    try {
      audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.55;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const N = 14;
      function tick() {
        analyser.getByteFrequencyData(data);
        audioLevels = Array.from({ length: N }, (_, i) => {
          const s = Math.floor(i * data.length / N);
          const e = Math.floor((i + 1) * data.length / N);
          let sum = 0;
          for (let j = s; j < e; j++) sum += data[j];
          return (sum / (e - s)) / 255;
        });
        animFrameId = requestAnimationFrame(tick);
      }
      tick();
    } catch { /* ignore — waveform is decorative */ }
  }

  onMount(() => {
    loadHistory();
  });
</script>

<div class="fixed inset-0 flex flex-col bg-white" style="font-family: 'Quicksand', sans-serif;">
  <!-- Header -->
  <div class="flex items-center gap-3 px-4 pb-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white shrink-0" style="padding-top: calc(env(safe-area-inset-top) + 1.25rem);">
    <a
      href="/mobile"
      aria-label="Kembali"
      class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors shrink-0"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
      </svg>
    </a>
    <div class="flex-1 min-w-0">
      <h1 class="text-base font-bold leading-tight">Chat AI</h1>
      <p class="text-[11px] text-sky-100 truncate">{providers.find(p => p.id === chatProvider)?.label ?? chatProvider}</p>
    </div>
    <button
      onclick={clearChat}
      aria-label="Hapus riwayat"
      class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors shrink-0"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
    </button>
    <button
      onclick={openConfig}
      aria-label="Pengaturan"
      class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors shrink-0"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    </button>
  </div>

  <!-- Messages -->
  <div
    bind:this={chatContainerEl}
    class="flex-1 overflow-y-auto px-4 py-4 space-y-3"
    style="background-image: linear-gradient(180deg, rgba(224,242,254,0.3) 0%, rgba(255,255,255,0) 25%);"
  >
    {#if chatHistory.length === 0 && !chatLoading}
      <div class="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
        <div class="w-20 h-20 rounded-3xl bg-linear-to-br from-sky-100 to-blue-100 flex items-center justify-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <div>
          <p class="text-base font-bold text-slate-700">Halo! Apa yang bisa kubantu?</p>
          <p class="text-sm text-slate-400 mt-1">Tanya soal keuangan, analisis pengeluaran,<br>atau apapun yang kamu mau.</p>
        </div>
      </div>
    {/if}

    {#each chatHistory as msg (msg.id)}
      <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 items-end">
        {#if msg.role === 'assistant'}
          <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mb-4
            {msg.isError ? 'bg-amber-100 border border-amber-200' : 'bg-linear-to-br from-sky-400 to-blue-500'}">
            {#if msg.isError}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
              </svg>
            {/if}
          </div>
        {/if}
        <div class="max-w-[78%] flex flex-col {msg.role === 'user' ? 'items-end' : 'items-start'}">
          <div class="px-4 py-2.5 rounded-2xl {msg.role === 'user'
            ? 'bg-linear-to-br from-sky-400 to-blue-500 text-white rounded-br-sm'
            : msg.isError
              ? 'bg-amber-50 border border-amber-200 text-amber-800 rounded-bl-sm'
              : 'bg-white border border-slate-100 shadow-sm text-slate-800 rounded-bl-sm'}">
            {#if msg.isError}
              <p class="text-[11px] font-semibold text-amber-500 mb-1">Terjadi kesalahan</p>
            {/if}
            <p class="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
          <span class="text-[10px] text-slate-400 mt-1 px-1">{formatTime(msg.timestamp)}</span>
        </div>
      </div>
    {/each}

    {#if chatLoading}
      <div class="flex justify-start gap-2 items-end">
        <div class="w-8 h-8 rounded-full bg-linear-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
          </svg>
        </div>
        <div class="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
          <div class="flex gap-1.5 items-center">
            <span class="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style="animation-delay:0ms"></span>
            <span class="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style="animation-delay:150ms"></span>
            <span class="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style="animation-delay:300ms"></span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Config sidebar -->
  {#if showConfig}
    <!-- Backdrop -->
    <button
      class="fixed inset-0 z-80 bg-black/40 backdrop-blur-sm cursor-default"
      onclick={() => showConfig = false}
      aria-label="Tutup pengaturan"
    ></button>

    <!-- Panel -->
    <div class="fixed top-0 right-0 bottom-0 z-90 w-[80vw] max-w-xs bg-white shadow-2xl flex flex-col" style="padding-top: env(safe-area-inset-top);">
      <!-- Sidebar header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 class="text-base font-bold text-slate-700">Pengaturan</h2>
        <button onclick={() => showConfig = false} aria-label="Tutup" class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 active:bg-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-6">

        <!-- Provider -->
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Provider AI</p>
          <div class="space-y-2">
            {#each providers as p}
              <button
                onclick={() => chatProvider = p.id}
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left
                  {chatProvider === p.id
                    ? 'border-sky-300 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'}"
              >
                <div class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                  {chatProvider === p.id ? 'border-sky-500' : 'border-slate-300'}">
                  {#if chatProvider === p.id}
                    <div class="w-2 h-2 rounded-full bg-sky-500"></div>
                  {/if}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold leading-tight">{p.label}</p>
                  <p class="text-[11px] text-slate-400 truncate">{p.desc}</p>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Microphone -->
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mikrofon</p>
          {#if micDevices.length === 0}
            <p class="text-sm text-slate-400 italic">Tidak ada perangkat ditemukan</p>
          {:else}
            <div class="space-y-2">
              {#each micDevices as dev}
                <button
                  onclick={() => selectedMicId = dev.deviceId}
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left
                    {selectedMicId === dev.deviceId
                      ? 'border-sky-300 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'}"
                >
                  <div class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                    {selectedMicId === dev.deviceId ? 'border-sky-500' : 'border-slate-300'}">
                    {#if selectedMicId === dev.deviceId}
                      <div class="w-2 h-2 rounded-full bg-sky-500"></div>
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold leading-tight truncate">
                      {dev.label || `Mikrofon ${micDevices.indexOf(dev) + 1}`}
                    </p>
                    <p class="text-[11px] text-slate-400 font-mono truncate">{dev.deviceId.slice(0, 20)}…</p>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>

      </div>
    </div>
  {/if}

  <!-- Input area -->
  <div class="px-3 pt-2 bg-white border-t border-slate-100 shrink-0" style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem);">
    {#if chatError}
      <p class="text-xs text-red-500 mb-1.5 px-1">{chatError}</p>
    {/if}

    {#if modelLoadProgress}
      <p class="text-xs text-sky-500 mb-1.5 px-1 flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
        {modelLoadProgress}
      </p>
    {/if}

    <!-- Waveform visualizer -->
    {#if isRecording}
      <div class="flex items-end justify-center gap-0.75 mb-2 px-2" style="height: 36px;">
        {#each audioLevels as level}
          {#if level > 0.04}
            <div
              class="w-0.75 bg-red-500 rounded-full"
              style="height: {Math.max(4, Math.round(level * 32))}px; transition: height 80ms ease-out;"
            ></div>
          {:else}
            <div class="w-0.75 h-0.75 bg-red-300 rounded-full" style="transition: height 80ms ease-out;"></div>
          {/if}
        {/each}
      </div>
    {/if}

    <div class="flex items-end gap-2">
      <textarea
        bind:this={textareaEl}
        bind:value={chatInput}
        placeholder={isRecording ? 'Mendengarkan...' : 'Tulis pesan...'}
        rows="1"
        onkeydown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        class="flex-1 resize-none border rounded-2xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:bg-white leading-relaxed transition-colors {isRecording ? 'border-red-300 ring-2 ring-red-100 bg-red-50/30' : 'border-slate-200 focus:ring-sky-300'}"
      ></textarea>
      <button
        onclick={toggleVoice}
        disabled={isTranscribing}
        aria-label={isRecording ? 'Stop rekam' : isTranscribing ? 'Memproses' : 'Rekam suara'}
        class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-60 {isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-300/60' : isTranscribing ? 'bg-sky-100 text-sky-500' : 'bg-slate-100 text-slate-500 active:bg-slate-200'}"
      >
        {#if isTranscribing}
          <!-- Spinner -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M12 4a8 8 0 018 8" />
          </svg>
        {:else if isRecording}
          <!-- Stop icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
          </svg>
        {:else}
          <!-- Mic icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
          </svg>
        {/if}
      </button>
      <button
      type="button"
        onclick={sendMessage}
        disabled={!chatInput.trim() || chatLoading}
        aria-label="Kirim pesan"
        class="w-11 h-11 rounded-full bg-linear-to-br from-sky-400 to-blue-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform shadow-md shadow-sky-200/50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
      </button>
    </div>
  </div>
</div>
