// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://popayaninteractiva.co',
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  // Sin resaltado de código: Shiki usa estilos en línea que choca con la CSP
  markdown: { syntaxHighlight: false },
  vite: {
    // El worker de MapLibre es un módulo ES
    worker: { format: 'es' },
    // MapLibre carga su worker con una ruta relativa a su propio módulo: no se preempaqueta
    optimizeDeps: { exclude: ['maplibre-gl'] },
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
});
