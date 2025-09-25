import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.js'),
        contentScript: resolve(__dirname, 'src/contentScript.js'),
        sidepanel: resolve(__dirname, 'src/sidepanel/sidepanel.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'sidepanel') {
            return 'sidepanel/sidepanel.js';
          }
          return '[name].js';
        },
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/manifest.json',
          dest: '.',
        },
        {
          src: 'src/images',
          dest: '.',
        },
        {
          src: 'src/components',
          dest: '.',
        },
        {
          src: 'src/sidepanel/sidepanel.html',
          dest: 'sidepanel',
        },
        {
          src: 'src/sidepanel/sidepanel.css',
          dest: 'sidepanel',
        },
      ],
    }),
  ],
});