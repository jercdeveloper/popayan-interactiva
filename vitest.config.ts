import { defineConfig } from 'vitest/config';

// Pruebas unitarias y de contenido. Las de navegador (Playwright) viven en pruebas/e2e.
export default defineConfig({
  test: {
    include: ['pruebas/unidad/**/*.test.ts'],
  },
});
