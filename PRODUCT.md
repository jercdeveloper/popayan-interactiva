# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 7 (sitio estático) + TypeScript; MapLibre GL con teselas propias (Protomaps/PMTiles o teselas exportadas); service worker con Workbox; alojamiento en SiteGround (plan GrowBig), con cabeceras y redirecciones en `public/.htaccess`. Supabase solo desde la fase 3. Detalle y razones: `docs/revision-tecnica.md` en la carpeta de OneDrive del proyecto.

## Users

- **Visitantes que recorren el Centro Histórico a pie** (turistas nacionales y extranjeros), con el celular en la mano, al sol, con poca señal, a menudo en Semana Santa o en el Congreso Gastronómico. Su tarea: saber dónde están, qué están viendo y adónde ir después.
- **Payaneses** que quieren redescubrir su ciudad y mostrarla con orgullo.
- **Estudiantes y docentes** de colegios y universidades de Popayán (módulo de Educación, fase 3).
- Público mixto que incluye **adultos mayores y niños**.

## Product Purpose

Una plataforma web gratuita (PWA) que convierte el Centro Histórico de Popayán en un recorrido interactivo: mapa, rutas temáticas, historias verificadas de cada lugar, línea de tiempo y, en fases siguientes, Semana Santa, Pasaporte de sellos, educación y economía local. Nace para aportar a la región y ayudar a cambiar una imagen del Cauca marcada por la violencia, mostrando su historia, su cocina, su gente y su memoria. El éxito es que un visitante recorra la ciudad con ella sin necesitar otra guía, y que los payaneses la compartan.

## Positioning

No existe una guía digital pública del Centro Histórico de Popayán. Esta es local, gratuita, con contenido verificado y citado, funciona sin conexión y está hecha por y para Popayán: su lenguaje sale de la ciudad misma (la Torre del Reloj y su única manecilla, la cal y la teja, La Nariz).

## Operating Context

- Uso en la calle: una mano, sol directo, conexión intermitente; también uso tranquilo en casa o en el hotel para planear y leer.
- Picos de uso en Semana Santa (patrimonio inmaterial de la UNESCO desde 2009) y en el Congreso Gastronómico de septiembre.
- Hoja de ruta en 5 fases (plan en OneDrive). **Fase 1 (en construcción):** Explorar (mapa con 12–15 lugares), Rutas (4), Historia (línea de tiempo), Agenda básica, Información útil, uso sin conexión, "Cerca de ti", tarjetas para compartir y "¿Sabías que…?".

## Capabilities and Constraints

- Contenido editorial en Markdown con fuentes obligatorias por ficha; cero datos sin verificar.
- La ubicación se calcula en el dispositivo y nunca se envía ni se guarda.
- Sin cuentas para menores de edad (Ley 1581 de 2012).
- Teselas de OpenStreetMap: prohibido descargarlas para uso sin conexión desde sus servidores; por eso se alojan teselas propias.
- Español primero; inglés en una fase posterior.
- Sin imágenes generadas con IA de lugares, personas o tradiciones reales.

## Brand Commitments

- Nombre: **Popayán Interactiva**. Lema: *Donde el tiempo no pasa*.
- Logo: dibujo lineal de la Torre del Reloj hecho por el usuario, con **una sola manecilla** (como el reloj real de 1737), y el nombre en Atkinson Hyperlegible Next. Archivos: `src/assets/marca/`.
- Mascota y voz: **La Nariz** (la torre, por su apodo "la Nariz de Popayán").
- Identidad visual y dirección de diseño ya decididas por el usuario: `docs/identidad-visual.md` y `docs/direccion-de-diseno.md` (OneDrive). La dirección de diseño es de cumplimiento obligatorio: estéticamente impecable, moderna, animada con intención y sin patrones de app hecha con IA.

## Evidence on Hand

- Datos con fuente: Semana Santa en la UNESCO (2009), Ciudad Creativa de la Gastronomía, unos 100.000 turistas esperados en Semana Santa de 2024 (MinCIT), más de 30.000 asistentes al Congreso Gastronómico (Colombia.travel), Torre del Reloj de 1673–1682 con reloj de 1737 de una sola manecilla.
- **No hay todavía:** fotografía propia de los lugares, testimonios, aliados confirmados ni ilustración de La Nariz. No se deben inventar.

## Product Principles

1. Contenido verificado antes que contenido abundante.
2. Primero funciona en la calle: sin conexión, con una mano, al sol.
3. Popayán en cada detalle: nada que pueda pertenecer a cualquier otra app de turismo.
4. Privacidad por diseño: nada personal sale del teléfono.
5. Economía y voces locales primero.

## Accessibility & Inclusion

WCAG 2.2 AA en ambos temas; objetivos táctiles de 44 px como mínimo; texto base de 16 px o más; `prefers-reduced-motion` respetado siempre; funciona en Android de gama media-baja con red 3G/4G; lectura fácil y modo niños en fases posteriores.
