import { defineConfig } from 'vite';
import { execSync } from 'child_process';

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch { /* not a git checkout */ }
const buildDate = new Date().toISOString().slice(0, 10);

export default defineConfig({
  root: '.',
  // Served from GitHub Pages at https://<user>.github.io/Order-Tool/
  base: '/Order-Tool/',
  define: {
    __APP_VERSION__: JSON.stringify(`${buildDate}.${commitHash}`)
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 8080,
    host: '0.0.0.0'
  }
});
