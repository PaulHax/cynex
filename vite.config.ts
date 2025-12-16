import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const trajectoriesDir = resolve(__dirname, 'public/data/trajectories');

const trajectoryManifestPlugin = (): Plugin => {
  const generateManifest = () => {
    if (!existsSync(trajectoriesDir)) {
      mkdirSync(trajectoriesDir, { recursive: true });
    }
    const files = readdirSync(trajectoriesDir).filter(
      (f) => f.endsWith('.json') && f !== 'manifest.json'
    );
    writeFileSync(
      join(trajectoriesDir, 'manifest.json'),
      JSON.stringify({ files }, null, 2)
    );
  };

  return {
    name: 'trajectory-manifest',
    buildStart: generateManifest,
    configureServer(server) {
      generateManifest();
      server.watcher.on('all', (_event, path) => {
        if (
          path.startsWith(trajectoriesDir) &&
          path.endsWith('.json') &&
          !path.endsWith('manifest.json')
        ) {
          generateManifest();
        }
      });
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), trajectoryManifestPlugin()],
});
