// Reglas del contenido que Zod no puede revisar porque cruzan colecciones o archivos.
// El esquema (campos, tipos, límites) ya lo valida src/content.config.ts en cada compilación.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
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

describe('excursiones', () => {
  const excursiones = readdirSync('src/content/excursiones').map((f) => {
    const [, frente] = readFileSync(`src/content/excursiones/${f}`, 'utf8').split('---');
    return { id: f.replace(/\.md$/, ''), ...(parse(frente) as { aviso?: { fecha: string | Date } }) };
  });

  it('los avisos (volcán, vías) se revisaron hace menos de 60 días', () => {
    // Si esta prueba falla, hay que volver a revisar la fuente oficial y actualizar el aviso y su fecha
    const limite = Date.now() - 60 * 86_400_000;
    for (const e of excursiones) {
      if (!e.aviso) continue;
      expect(new Date(e.aviso.fecha).getTime(), `${e.id}: aviso revisado el ${e.aviso.fecha}`).toBeGreaterThan(limite);
    }
  });
});

describe('recetario', () => {
  const recetas = readdirSync('src/content/recetas').map((f) => {
    const [, frente] = readFileSync(`src/content/recetas/${f}`, 'utf8').split('---');
    return {
      id: f.replace(/\.md$/, ''),
      ...(parse(frente) as { orden: number; credito: string; dondeProbar?: string[]; relacionadas?: string[]; pasos?: string[] }),
    };
  });
  const ids = new Set(recetas.map((r) => r.id));

  it('los lugares donde se prueban existen', () => {
    for (const r of recetas) for (const l of r.dondeProbar ?? []) expect(idsLugares.has(l), `${r.id} → ${l}`).toBe(true);
  });

  it('las recetas relacionadas existen y no se nombran a sí mismas', () => {
    for (const r of recetas) {
      for (const x of r.relacionadas ?? []) {
        expect(ids.has(x), `${r.id} → ${x}`).toBe(true);
        expect(x, r.id).not.toBe(r.id);
      }
    }
  });

  it('cada receta dice de quién es', () => {
    for (const r of recetas) expect(r.credito.length, r.id).toBeGreaterThan(30);
  });

  it('el orden no se repite', () => {
    expect(new Set(recetas.map((r) => r.orden)).size).toBe(recetas.length);
  });
});

describe('personajes', () => {
  const personas = readdirSync('src/content/personajes').map((f) => {
    const [, frente] = readFileSync(`src/content/personajes/${f}`, 'utf8').split('---');
    return {
      id: f.replace(/\.md$/, ''),
      ...(parse(frente) as { iniciales: string; nacimiento: { anio: number }; muerte?: { anio: number }; lugares?: string[] }),
    };
  });

  it('sus lugares existen', () => {
    for (const p of personas) for (const l of p.lugares ?? []) expect(idsLugares.has(l), `${p.id} → ${l}`).toBe(true);
  });

  it('nadie muere antes de nacer ni vive más de 110 años', () => {
    for (const p of personas) {
      if (!p.muerte) continue;
      expect(p.muerte.anio, p.id).toBeGreaterThan(p.nacimiento.anio);
      expect(p.muerte.anio - p.nacimiento.anio, p.id).toBeLessThan(110);
    }
  });

  it('las iniciales son mayúsculas', () => {
    for (const p of personas) expect(p.iniciales, p.id).toMatch(/^[A-ZÁÉÍÓÚÑ]{2,3}$/);
  });
});
