import { defineConfig } from 'vite';
import { resolve } from 'path';
import { WebSocketServer } from 'ws';

const RELOAD_PORT = 8789;

// Plugin that starts a WebSocket server during watch mode.
// After every build, it sends a "reload" message to all connected clients.
// The extension's background script connects and calls chrome.runtime.reload() on message.
function chromeReloadPlugin() {
  let wss: InstanceType<typeof WebSocketServer> | null = null;

  return {
    name: 'chrome-extension-reload',
    buildStart() {
      if (wss) return;
      try {
        wss = new WebSocketServer({ port: RELOAD_PORT });
        wss.on('connection', () => console.log(`[reload] Extension connected (${wss!.clients.size} client(s))`));
        wss.on('error', (err) => console.error(`[reload] WebSocket error: ${err.message}`));
        console.log(`[reload] WebSocket server listening on ws://localhost:${RELOAD_PORT}`);
      } catch (err) {
        console.error(`[reload] Failed to start WebSocket server: ${(err as Error).message}`);
      }
    },
    closeBundle() {
      if (!wss) return;
      // Small delay to let files settle on disk before reloading
      setTimeout(() => {
        const clients = [...wss!.clients].filter(c => c.readyState === 1);
        if (clients.length > 0) {
          clients.forEach(c => c.send('reload'));
          console.log(`[reload] Sent reload to ${clients.length} client(s)`);
        } else {
          console.log('[reload] No clients connected — extension won\'t reload');
        }
      }, 300);
    }
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    watch: {
      // Add folders here to ignore them from triggering a rebuild/reload
      exclude: ['assets/**', 'test-page/**', 'node_modules/**']
    },
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.ts'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        format: 'es'
      }
    },
    target: 'es2020',
    minify: false
  },
  plugins: [chromeReloadPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
