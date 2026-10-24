import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const fuente = z.object({
  titulo: z.string(),
  url: z.url(),
});

/**
 * Cada lugar del mapa. Las coordenadas vienen de OpenStreetMap (campo `osm`). Si el lugar no está en
 * OpenStreetMap, se ubica por la dirección que dan sus fuentes (`direccion`) o por el punto que marcó
 * en un mapa una persona que conoce el lugar (`ubicacion`).
 */
const lugares = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lugares' }),
  schema: z
    .object({
      nombre: z.string(),
      categoria: z.enum([
        'templo',
        'puente',
        'museo',
        'plaza',
        'monumento',
        'teatro',
        'gobierno',
        'casa',
        'cocina',
        'hacienda',
        'desaparecido',
      ]),
      // Popayán y las haciendas de sus alrededores
      coordenadas: z.tuple([z.number().min(2.3).max(2.6), z.number().min(-76.8).max(-76.4)]),
      osm: z
        .string()
        .regex(/^(node|way|relation)\/\d+$/)
        .optional(),
      direccion: z.string().optional(),
      ubicacion: z.url().optional(),
      /** Negocio privado: la ficha pide confirmar horario y que siga abierto */
      negocio: z.boolean().default(false),
      epoca: z.string(),
      resumen: z.string().max(200),
      /** Dato curioso para "¿Sabías que…?" contado por La Nariz */
      dato: z.string().max(220).optional(),
      fuentes: z.array(fuente).min(1),
      /** "pendiente" mientras no la valide una persona experta en historia local */
      revision: z.enum(['pendiente', 'revisada']).default('pendiente'),
    })
    .refine((l) => l.osm || l.direccion || l.ubicacion, {
      message: 'Cada lugar necesita su objeto de OpenStreetMap, su dirección o su ubicación',
    }),
});

const rutas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/rutas' }),
  schema: z.object({
    nombre: z.string(),
    lema: z.string().max(120),
    orden: z.number().int(),
    /** Foto de portada (id de un archivo en src/assets/fotos) */
    foto: z.string().optional(),
    /** Las haciendas quedan fuera de la ciudad: esa ruta se hace en carro */
    modo: z.enum(['pie', 'carro']).default('pie'),
    paradas: z.array(reference('lugares')).min(3),
  }),
});

const hitos = defineCollection({
  loader: file('src/content/hitos.json'),
  schema: z.object({
    anio: z.number().int(),
    titulo: z.string(),
    texto: z.string().max(260),
    lugar: reference('lugares').optional(),
    fuente: fuente,
  }),
});

/**
 * La agenda del año. Las fechas que todavía no anuncian los organizadores se marcan como no confirmadas
 * y se muestran con su texto (`cuando`); `inicio` y `fin` sirven para ordenar y para la cuenta regresiva.
 */
const eventos = defineCollection({
  loader: file('src/content/agenda.json'),
  schema: z.object({
    nombre: z.string(),
    /** El nombre dentro de una frase, con su artículo: "las Fiestas de Pubenza" */
    enFrase: z.string(),
    cuando: z.string(),
    inicio: z.iso.date(),
    fin: z.iso.date().optional(),
    confirmada: z.boolean(),
    lugar: reference('lugares').optional(),
    resumen: z.string().max(260),
    /** Las noches de una semana con varios actos, como la Semana Santa */
    jornadas: z
      .array(
        z.object({
          fecha: z.iso.date(),
          nombre: z.string(),
          hora: z.string().optional(),
          lugar: reference('lugares').optional(),
        }),
      )
      .optional(),
    ruta: reference('rutas').optional(),
    fuentes: z.array(fuente).min(1),
  }),
});

export const collections = { lugares, rutas, hitos, eventos };
