# Popayán Interactiva

Guía gratuita del Centro Histórico de Popayán y sus alrededores: rutas, agenda, historias con fuentes y un mapa que funciona sin señal. Es una PWA hecha con Astro y se publica en SiteGround.

La visión, la identidad y la dirección de diseño viven en la carpeta del proyecto en OneDrive (`docs/`). El resumen de producto está en [PRODUCT.md](PRODUCT.md).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Compila el sitio en `dist/`, genera las tarjetas para compartir y el service worker |
| `npm run paquete` | Compila y empaca `dist/` en `popayan-interactiva.zip`, listo para subir a SiteGround |
| `npm run preview` | Sirve la compilación para probarla (CSP y modo sin conexión incluidos) |
| `npm run check` | Revisa tipos y contenido |
| `npm run marca` | Regenera logotipo, favicon e íconos a partir de la torre vectorizada |
| `npm run mapa` | Vuelve a extraer las teselas del mapa de Popayán (cambia la fecha en el script) |
| `npm test` | Pruebas unitarias y de contenido (Vitest): cálculos, fechas, referencias entre colecciones, créditos de fotos y reglas de estilo |
| `npm run test:e2e` | Pruebas en el navegador (Playwright con el Edge instalado) sobre `dist/`: cada página sin errores ni violaciones de la CSP, mapa, búsqueda, compartir y modo sin conexión, en celular y escritorio |
| `npm run test:todo` | Compila y corre las dos |

Antes de publicar, corre `npm run test:todo`. Las pruebas en el navegador necesitan una compilación reciente: sirven `dist/` con `astro preview` en el puerto 4322.

## Estructura

```text
src/
  content/
    lugares/    Una ficha Markdown por lugar, con coordenadas y fuentes obligatorias
    rutas/      Rutas (a pie o en carro): paradas en orden y la foto de portada
    hitos.json  Línea de tiempo
    agenda.json Eventos del año, con fecha confirmada o por confirmar
  components/  vidrio/ (barra de pestañas, cabecera con foto, círculos, mapa de ruta), Compartir, Icono, Pie
  pages/       Portada, rutas, lugares, mapa, agenda, información útil, historia, acerca
  styles/      vidrio.css: tokens y piezas del sistema Liquid Glass (ver DESIGN.md)
  assets/fotos Fotos de Wikimedia Commons con licencia libre; créditos en creditos.json
  assets/marca Torre vectorizada (una sola manecilla) y logotipo
public/
  .htaccess    Cabeceras de seguridad, caché y direcciones limpias para SiteGround (Apache)
  mapa/        Teselas y glifos propios para el mapa sin conexión
  iconos/      Íconos de la PWA
scripts/       Vectorización del logo, recursos de marca, extracción del mapa, tarjetas para compartir y service worker
```

## Cómo agregar un lugar

1. Crea `src/content/lugares/<id>.md` copiando una ficha existente.
2. Toma las coordenadas y el id de OpenStreetMap (campo `osm`).
3. Escribe un resumen de 200 caracteres como máximo y el cuerpo, y cita al menos una fuente. Si un dato no tiene fuente, no va.
4. Deja `revision: pendiente` hasta que lo valide una persona experta.
5. Ejecuta `npm run check`: el esquema rechaza fichas incompletas.

## Publicar en SiteGround (plan GrowBig)

El sitio es estático: se publica subiendo el contenido de `dist/` a `public_html`.

1. `npm run paquete` compila todo y crea `popayan-interactiva.zip`.
2. En Site Tools → Sitio → Administrador de archivos, entra a `public_html`, sube el zip y descomprímelo ahí. Incluye `.htaccess`: si el administrador oculta los archivos que empiezan por punto, actívalos para verlo.
3. En Site Tools → Seguridad → Administrador SSL, instala el certificado gratuito de Let's Encrypt y activa «Forzar HTTPS».
4. Comprueba las cabeceras desde una terminal. NGINX entrega los archivos estáticos y puede poner sus propias cabeceras de caché, así que hay que verlas en el servidor real:

   ```bash
   curl -I https://popayaninteractiva.co/
   curl -I https://popayaninteractiva.co/sw.js
   curl -I https://popayaninteractiva.co/rutas
   ```

   La portada debe traer `Strict-Transport-Security` y `X-Content-Type-Options`; `sw.js`, `Cache-Control: no-cache`; y `/rutas` debe responder 200 sin redirigir a `/rutas/`.
5. Si cambiaste páginas y no se ven, vacía la caché dinámica en Site Tools → Velocidad → Caché.

Más adelante se puede automatizar con SSH (puerto 18765) y una llave en Site Tools → Devs → Administrador de llaves SSH.

## Principios

- Contenido verificado antes que abundante.
- Funciona en la calle: sin conexión, con una mano, al sol.
- La ubicación nunca sale del dispositivo.
- Sin estilos en línea ni scripts de terceros (CSP estricta).
