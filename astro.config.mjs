// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: [
        '@huggingface/transformers',
        'onnxruntime-web',
        'onnxruntime-node',
        'sharp',
      ]
    }
  },
  integrations: [svelte()]
});
