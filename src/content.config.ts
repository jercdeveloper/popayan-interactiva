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

/**
 * Las procesiones de Semana Santa. La fecha no se escribe: sale del Domingo de Pascua de cada año
 * (`desdePascua` son los días antes de él). El recorrido es la lista de esquinas de src/lib/esquinas.ts,
 * calcada de los mapas que publica la Junta Permanente Pro Semana Santa.
 */
const procesiones = defineCollection({
  loader: file('src/content/procesiones.json'),
  schema: z.object({
    orden: z.number().int(),
    dia: z.string(),
    desdePascua: z.number().int().min(-7).max(-1),
    nombre: z.string(),
    /** "20:00", o un texto cuando no hay hora fija ("Por la tarde") */
    hora: z.string(),
    templo: reference('lugares'),
    /** Cuando la procesión termina en otro templo (el Domingo de Ramos llega a la Catedral) */
    destino: reference('lugares').optional(),
    resumen: z.string().max(220),
    recorrido: z.array(z.string().regex(/^cra\d+-cl\d+$/)).min(4).optional(),
    pasos: z.array(
      z.object({
        nombre: z.string(),
        /** De dónde y de cuándo son las imágenes, como lo publica la Junta */
        origen: z.string().optional(),
      }),
    ),
    fuentes: z.array(fuente).min(1),
  }),
});

/**
 * Excursiones de un día (o dos) desde Popayán, para el Planificador. Las condiciones cambian (vías,
 * volcanes, horarios): el aviso lleva la fecha en que se revisó y un enlace a la fuente oficial.
 */
const excursiones = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/excursiones' }),
  schema: z.object({
    nombre: z.string(),
    resumen: z.string().max(220),
    /** Ícono de Phosphor para la cabecera, que va sin foto */
    icono: z.string(),
    distanciaKm: z.number().positive(),
    tiempo: z.string().optional(),
    /** Cuánto ocupa en el plan: medio día, el día entero o dos días (con noche fuera) */
    duracion: z.enum(['medio-dia', 'dia', 'dos-dias']),
    /** Día de la semana en que más vale la pena (0 domingo … 6 sábado): el mercado de Silvia es el martes */
    mejorDia: z.number().int().min(0).max(6).optional(),
    gustos: z.array(z.enum(['historia', 'templos', 'comida', 'naturaleza', 'cultura'])).min(1),
    aviso: z
      .object({
        texto: z.string(),
        /** Cuándo se revisó por última vez */
        fecha: z.coerce.date(),
        enlace: z.url(),
      })
      .optional(),
    fuentes: z.array(fuente).min(1),
  }),
});

/**
 * El Recetario vivo. Las recetas van con las palabras de la guía y el crédito de quien las cocina y de
 * quien las recogió. Lo que no está documentado (cantidades, pasos) no se inventa: la receta queda sin
 * ese dato.
 */
const recetas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recetas' }),
  schema: z.object({
    nombre: z.string(),
    resumen: z.string().max(220),
    tipo: z.enum(['base', 'plato', 'acompanamiento', 'bebida', 'dulce']),
    orden: z.number().int(),
    icono: z.string(),
    /** De quién es la receta y quién la recogió */
    credito: z.string(),
    ingredientes: z.array(z.object({ grupo: z.string().optional(), items: z.array(z.string()).min(1) })).min(1),
    /** Algunas recetas solo se conocen por sus ingredientes: entonces no llevan pasos */
    pasos: z.array(z.string()).optional(),
    dondeProbar: z.array(reference('lugares')).default([]),
    relacionadas: z.array(reference('recetas')).default([]),
    fuentes: z.array(fuente).min(1),
  }),
});

export const collections = { lugares, rutas, hitos, eventos, procesiones, excursiones, recetas };
