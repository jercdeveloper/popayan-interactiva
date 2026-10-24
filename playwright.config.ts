import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas en el navegador sobre el sitio ya compilado (npm run build), servido con astro preview.
 * Usan el Edge instalado en el equipo (channel: 'msedge'): no hace falta descargar navegadores.
 */
export default defineConfig({
  testDir: 'pruebas/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4322',
    channel: 'msedge',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
  },
  projects: [
    {
      name: 'movil',
      use: { ...devices['Pixel 7'], channel: 'msedge' },
    },
    {
      name: 'escritorio',
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npx astro preview --port 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: true,
  },
});
