// Reglas de estilo de docs/direccion-de-diseno.md §6 y de CLAUDE.md que se pueden revisar solas.
import { describe, expect, it } from 'vitest';
import { archivosDeInterfaz, eventos, hitos, lugares, rutas } from './contenido';

/** Clichés de turismo y de IA prohibidos en el texto */
const CLICHES = [
  /descubre la magia/i,
  /vive una experiencia única/i,
  /sumérgete en/i,
  /en el corazón de/i,
  /joya colonial/i,
  /un viaje en el tiempo/i,
  /te invitamos a/i,
  /déjate sorprender/i,
  /inigualable/i,
  /mágic[oa]/i,
];

const textos = [
  ...lugares.map((l) => ({ id: `lugar ${l.id}`, texto: [l.nombre, l.resumen, l.dato ?? '', l.cuerpo].join('\n') })),
  ...rutas.map((r) => ({ id: `ruta ${r.id}`, texto: [r.nombre, r.lema, r.cuerpo].join('\n') })),
  ...eventos.map((e) => ({ id: `evento ${e.id}`, texto: [e.nombre, e.cuando, e.resumen].join('\n') })),
  ...hitos.map((h) => ({ id: `hito ${h.id}`, texto: [h.titulo, h.texto].join('\n') })),
];

describe('texto del contenido', () => {
  it('no usa clichés de turismo', () => {
    for (const { id, texto } of textos) for (const c of CLICHES) expect(texto, `${id}: ${c}`).not.toMatch(c);
  });

  it('no usa rayas largas (—)', () => {
    for (const { id, texto } of textos) expect(texto.includes('—'), id).toBe(false);
  });
});

describe('código de la interfaz', () => {
  const archivos = archivosDeInterfaz();
  // El marcado de un componente: lo que queda fuera del frontmatter, los scripts y los estilos
  const marcado = (texto: string) =>
    texto
      .replace(/^---[\s\S]*?---/, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '');

  it('no usa atributos style="" (la CSP los bloquea)', () => {
    for (const { archivo, texto } of archivos) expect(marcado(texto), archivo).not.toMatch(/\sstyle=/);
  });

  it('no usa rayas largas en el texto visible', () => {
    for (const { archivo, texto } of archivos) {
      const visible = marcado(texto).replace(/<!--[\s\S]*?-->/g, '');
      expect(visible.includes('—'), archivo).toBe(false);
    }
  });

  it('no usa clichés de turismo', () => {
    for (const { archivo, texto } of archivos) for (const c of CLICHES) expect(marcado(texto), `${archivo}: ${c}`).not.toMatch(c);
  });

  it('no pide teselas a los servidores de OpenStreetMap', () => {
    for (const { archivo, texto } of archivos) expect(texto, archivo).not.toMatch(/tile\.openstreetmap\.org/);
  });
});

describe('archivos copiados', () => {
  it('la torre de public/ es la misma del logo', async () => {
    const { readFileSync } = await import('node:fs');
    expect(readFileSync('public/marca/isotipo.svg', 'utf8')).toBe(readFileSync('src/assets/marca/isotipo.svg', 'utf8'));
  });
});
