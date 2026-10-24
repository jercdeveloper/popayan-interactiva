---
name: Popayán Interactiva
description: El Centro Histórico de Popayán contado lugar por lugar, en el celular y sin señal. Liquid Glass y diseño de Apple, con fotos reales de la ciudad.
colors:
  fondo: "#f5f5f7"
  fondo-elevado: "#ffffff"
  texto: "#1d1d1f"
  texto-2: "rgb(60 60 67 / 0.72)"
  texto-3: "rgb(60 60 67 / 0.5)"
  separador: "rgb(60 60 67 / 0.14)"
  acento: "#c4532c"
  acento-presionado: "#a8441f"
  sobre-acento: "#ffffff"
  vidrio-tinte: "rgb(255 255 255 / 0.62)"
  vidrio-borde: "rgb(255 255 255 / 0.55)"
  oscuro-fondo: "#000000"
  oscuro-fondo-elevado: "#1c1c1e"
  oscuro-texto: "#f5f5f7"
  oscuro-acento: "#ff7a4d"
  oscuro-vidrio-tinte: "rgb(36 36 40 / 0.58)"
  noche-semana-santa: "#1b1622"
typography:
  gigante:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(2.6rem, 1.6rem + 4.6vw, 5.4rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  grande:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.9rem, 1.4rem + 2vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.07
    letterSpacing: "-0.028em"
  titulo:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  cuerpo:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "-0.022em"
  nota:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  mini:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  s: "12px"
  m: "20px"
  l: "28px"
  capsula: "999px"
spacing:
  margen: "clamp(1rem, 0.4rem + 3vw, 2.5rem)"
  ancho-max: "76rem"
  ancho-lectura: "42rem a 46rem"
  tactil: "44px"
---

# Popayán Interactiva: sistema de diseño

Liquid Glass y diseño de Apple, desde el 24 de octubre de 2026. La dirección obligatoria, con sus prohibiciones y su lista de chequeo, está en `docs/direccion-de-diseno.md` del proyecto (carpeta de OneDrive). Los tokens viven en `src/styles/vidrio.css`.

## 1. La idea

El contenido es sólido y protagonista: fotos reales de Popayán, el mapa, el texto con sus fuentes. El vidrio es solo la capa funcional que flota encima: la barra de pestañas, los círculos de control sobre las fotos, la hoja del mapa, los avisos y los paneles de texto sobre las fotos de las tarjetas. Nunca hay vidrio sobre vidrio.

## 2. Color

- Neutros de Apple: `#f5f5f7` de fondo y blanco para lo elevado; en oscuro, negro y `#1c1c1e`.
- **Un solo acento, terracota** (`#c4532c`; `#ff7a4d` en oscuro), el de los tejados. Va en botones llenos, pestaña activa, fechas, cifras, años y los íconos de las celdas.
- Texto secundario y terciario con transparencia, como en iOS, para que se adapte a cualquier superficie.
- Semana Santa tiene una tarjeta nocturna propia (`#1b1622` con un resplandor terracota) en los dos temas.

## 3. Tipografía

La fuente del sistema, sin fuentes web. Títulos en 700 con tracking negativo que crece con el tamaño; cuerpo de 17 px con tracking −0,022em; notas de 15 px y mínimos de 13 px. Las cifras usan `tabular-nums`. Las tarjetas para compartir (imágenes) usan Atkinson Hyperlegible Next en trazos, porque una imagen no puede usar la fuente del sistema.

## 4. El vidrio (`.vidrio`)

- Fondo: `--vidrio-tinte` con `backdrop-filter: blur(22px) saturate(180%)`.
- Borde: un filo interior de 1 px, más brillante arriba (`--vidrio-brillo`).
- Brillo especular: degradado a 160° en `soft-light`, de arriba a la izquierda.
- Sombra: suave y larga (`--vidrio-sombra`).
- Con `prefers-reduced-transparency` o `prefers-contrast: more`, pasa a sólido.

## 5. Componentes

| Componente | Archivo | Qué es |
|---|---|---|
| Barra de pestañas | `src/components/vidrio/BarraPestanas.astro` | Cápsula de vidrio con cinco pestañas (Inicio, Rutas, Mapa, Agenda, Útil). Abajo en el móvil y arriba al centro desde 48rem. La lente terracota salta con un resorte a la pestaña que se toca. |
| Cabecera con foto | `src/components/vidrio/CabeceraFoto.astro` | Foto a sangre con velo, título blanco abajo y controles arriba. Sin foto, superficie terracota con el ícono del tipo de lugar. |
| Círculo | `src/components/vidrio/Circulo.astro` | Botón o enlace circular de vidrio (volver, compartir, ver en el mapa). |
| Encabezado | `src/components/vidrio/Encabezado.astro` | Título grande para las páginas sin foto. |
| Mapa de ruta | `src/components/vidrio/MapaRuta.astro` | Mapa embebido con paradas numeradas y trazado punteado; pide dos dedos para moverse. |
| Compartir | `src/components/Compartir.astro` | Círculo que comparte la tarjeta (o el enlace) y avisa con una cápsula de vidrio. |
| Listas agrupadas | `.grupo`, `.celdas`, `.celda`, `.nota` en `vidrio.css` | Como en Ajustes: celdas sobre una superficie elevada, separadores finos, ícono terracota. |
| Botones | `.boton--lleno`, `.boton--vidrio`, `.boton--tinte` | Cápsulas de 50 px. Lleno para la acción principal; vidrio sobre fotos; tinte sobre superficies sólidas. |

## 6. Patrones de página

- **Portada:** foto a sangre del Parque Caldas, título gigante, dos acciones y el reloj de una manecilla con la hora de Popayán. Debajo, carrusel de rutas, widgets de "Hoy en Popayán" (agenda, dato, lugar) y un carrusel con la historia.
- **Fichas de lugar y ruta:** cabecera con foto y una hoja sólida que sube 1,75rem sobre ella, con radio de 28 px.
- **Mapa:** pantalla completa con una hoja de vidrio de tres alturas que se vuelve sólida al subir.
- **Agenda:** tarjetas con hoja de calendario (mes en terracota, día grande) y una cuenta regresiva arriba.
- **Información, Acerca:** listas agrupadas.
- **Historia:** línea vertical terracota con un punto por año y tarjetas sólidas.

## 7. Movimiento

Resortes de `motion` sin rebote por defecto; un poco de rebote solo tras un lanzamiento con inercia. Respuesta al presionar (`:active` con escala). Proyección de Apple para elegir la altura de la hoja del mapa y resistencia en los bordes. Fundido nativo entre páginas (`@view-transition`). Todo se desactiva con `prefers-reduced-motion`.

## 8. Fotografía

Fotos de Wikimedia Commons con licencia libre, en `src/assets/fotos/` con sus créditos en `creditos.json`; se leen con `fotoDe(id)` de `src/lib/fotos.ts`. Cada página muestra el crédito de sus fotos y `/acerca#fotos` los lista todos. Nunca una foto de otro lugar ni una imagen generada con IA.

## 9. Tarjetas para compartir

`scripts/generar-tarjetas.mjs`, después de compilar. Vertical 1080×1350 y vista previa 1200×630, en JPEG. La foto del lugar a sangre, la cápsula de la marca arriba y un panel de vidrio real (la misma foto desenfocada) con el tipo, el nombre, el dato o la ruta y la dirección web. El crédito de la foto va en una cápsula oscura.
