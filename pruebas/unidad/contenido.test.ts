// Reglas del contenido que Zod no puede revisar porque cruzan colecciones o archivos.
// El esquema (campos, tipos, límites) ya lo valida src/content.config.ts en cada compilación.
import { describe, expect, it } from 'vitest';
import { archivosDeFotos, creditos, eventos, hitos, lugares, rutas } from './contenido';

const idsLugares = new Set(lugares.map((l) => l.id));
const idsRutas = new Set(rutas.map((r) => r.id));

describe('lugares', () => {
  it('no hay dos lugares en el mismo punto', () => {
    const vistos = new Map<string, string>();
    for (const l of lugares) {
      const clave = l.coordenadas.map((c) => c.toFixed(5)).join(',');
      expect(vistos.get(clave), `${l.id} comparte coordenadas con ${vistos.get(clave)}`).toBeUndefined();
      vistos.set(clave, l.id);
    }
  });
});

describe('rutas', () => {
  it('cada parada existe', () => {
    for (const r of rutas) for (const p of r.paradas) expect(idsLugares.has(p), `${r.id} → ${p}`).toBe(true);
  });

  it('ninguna parada se repite dentro de una ruta', () => {
    for (const r of rutas) expect(new Set(r.paradas).size, r.id).toBe(r.paradas.length);
  });

  it('el orden de las rutas no se repite', () => {
    const ordenes = rutas.map((r) => r.orden);
    expect(new Set(ordenes).size).toBe(ordenes.length);
  });

  it('la foto de cada ruta existe y tiene crédito', () => {
    for (const r of rutas) {
      if (!r.foto) continue;
      expect(archivosDeFotos, r.id).toContain(r.foto);
      expect(creditos[r.foto], r.id).toBeDefined();
    }
  });

  it('solo las haciendas se recorren en carro', () => {
    for (const r of rutas.filter((r) => r.modo === 'carro')) {
      const categorias = new Set(r.paradas.map((p) => lugares.find((l) => l.id === p)!.categoria));
      expect([...categorias].every((c) => c === 'hacienda' || c === 'puente'), r.id).toBe(true);
    }
  });
});

describe('fotos', () => {
  it('cada foto tiene su crédito, y cada crédito su foto', () => {
    expect(new Set(archivosDeFotos)).toEqual(new Set(Object.keys(creditos)));
  });

  it('las licencias son libres y conocidas', () => {
    for (const [id, c] of Object.entries(creditos)) {
      expect(c.licencia, id).toMatch(/^(CC BY(-SA)? [\d.]+|CC0( 1\.0)?|Dominio público)$/);
      expect(c.autor.trim(), id).not.toBe('');
      expect(c.fuente, id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });
});

describe('agenda', () => {
  it('ningún evento termina antes de empezar', () => {
    for (const e of eventos) if (e.fin) expect(e.fin >= e.inicio, e.id).toBe(true);
  });

  it('las jornadas caen dentro del evento y van en orden', () => {
    for (const e of eventos.filter((e) => e.jornadas)) {
      const fechas = e.jornadas!.map((j) => j.fecha);
      expect([...fechas].sort(), e.id).toEqual(fechas);
      for (const f of fechas) {
        expect(f >= e.inicio && f <= (e.fin ?? e.inicio), `${e.id}: ${f}`).toBe(true);
      }
    }
  });

  it('los lugares y rutas que nombra existen', () => {
    for (const e of eventos) {
      if (e.lugar) expect(idsLugares.has(e.lugar), `${e.id} → ${e.lugar}`).toBe(true);
      if (e.ruta) expect(idsRutas.has(e.ruta), `${e.id} → ${e.ruta}`).toBe(true);
      for (const j of e.jornadas ?? []) if (j.lugar) expect(idsLugares.has(j.lugar), `${e.id} → ${j.lugar}`).toBe(true);
    }
  });

  it('el nombre en frase va en mitad de oración ("Faltan 3 días para el Congreso…")', () => {
    // Artículo en minúscula, o un nombre propio sin artículo ("Popayán Ciudad Libro")
    for (const e of eventos) expect(e.enFrase, e.id).not.toMatch(/^(El|La|Los|Las) /);
  });

  it('los ids no se repiten', () => {
    expect(new Set(eventos.map((e) => e.id)).size).toBe(eventos.length);
  });
});

describe('historia', () => {
  it('los hitos van en orden y sus lugares existen', () => {
    const anios = hitos.map((h) => h.anio);
    expect([...anios].sort((a, b) => a - b)).toEqual(anios);
    for (const h of hitos) if (h.lugar) expect(idsLugares.has(h.lugar), h.id).toBe(true);
  });
});
