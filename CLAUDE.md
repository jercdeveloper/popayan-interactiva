## Popayán Interactiva

- Product truth: `PRODUCT.md`. Mandatory design direction and identity: `C:\Users\juane\OneDrive\Documentos\Proyectos\Popayán Interactiva\docs\direccion-de-diseno.md` and `identidad-visual.md`. Read them before any UI work; the standard is "impeccable, modern, animated, no AI-app patterns".
- All UI copy is in Spanish (Colombia). No em dashes in UI copy, no tourism clichés ("descubre la magia", "joya colonial").
- Strict CSP (Astro `security.csp`): never use `style=""` attributes or inline `style={...}` in markup; put values in CSS. JS may set `element.style` properties.
- Content rules: every place needs coordinates from OpenStreetMap (`osm` field) and at least one source; unverified facts are not published.
- Map tiles are self-hosted (`public/mapa/`); never use tile.openstreetmap.org.
- Do not commit or push unless the user asks.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
