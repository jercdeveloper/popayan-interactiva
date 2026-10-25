import { test, expect, type Page } from '@playwright/test';

/** Junta los errores de la página: excepciones, errores de consola y violaciones de la CSP */
function vigilarErrores(page: Page) {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  return errores;
}

const PAGINAS = [
  { ruta: '/', titulo: 'Popayán, contada lugar por lugar' },
  { ruta: '/rutas', titulo: 'Rutas' },
  { ruta: '/rutas/templos', titulo: 'Ruta de los templos' },
  { ruta: '/rutas/haciendas', titulo: 'Ruta de las haciendas' },
  { ruta: '/lugares/la-ermita', titulo: 'La Ermita de Jesús Nazareno' },
  { ruta: '/lugares/palacio-nacional', titulo: 'Palacio Nacional' },
  { ruta: '/mapa', titulo: null },
  { ruta: '/agenda', titulo: 'Agenda' },
  { ruta: '/informacion', titulo: 'Información útil' },
  { ruta: '/historia', titulo: 'Cinco siglos de historia' },
  { ruta: '/acerca', titulo: 'Hecha en Popayán, para Popayán' },
  { ruta: '/semana-santa', titulo: 'Semana Santa' },
  { ruta: '/semana-santa/viernes-santo', titulo: 'Procesión del Santo Entierro' },
  { ruta: '/semana-santa/domingo-de-ramos', titulo: 'Procesión del Señor del Triunfo' },
  { ruta: '/semana-santa/guia', titulo: 'Cómo se hace una procesión' },
  { ruta: '/planificador', titulo: 'Planea tu viaje' },
  { ruta: '/excursiones/purace', titulo: 'Parque Nacional Natural Puracé' },
  { ruta: '/excursiones/tierradentro', titulo: 'Tierradentro' },
];

for (const { ruta, titulo } of PAGINAS) {
  test(`${ruta} carga sin errores`, async ({ page }) => {
    const errores = vigilarErrores(page);
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status()).toBe(200);
    if (titulo) await expect(page.getByRole('heading', { level: 1 })).toContainText(titulo);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
    await page.waitForLoadState('networkidle');
    expect(errores).toEqual([]);
  });
}

test('una dirección que no existe responde 404 con su página', async ({ page }) => {
  const respuesta = await page.goto('/esta-calle-no-existe');
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta calle no aparece en el mapa');
});

test('la barra de pestañas lleva a cada sección y marca la activa', async ({ page }) => {
  await page.goto('/');
  const barra = page.getByRole('navigation', { name: /secciones|principal|pestañas/i });
  await barra.getByRole('link', { name: 'Agenda' }).click();
  await expect(page).toHaveURL(/\/agenda$/);
  await expect(barra.getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page');
  await barra.getByRole('link', { name: 'Rutas' }).click();
  await expect(page).toHaveURL(/\/rutas$/);
  await expect(barra.getByRole('link', { name: 'Rutas' })).toHaveAttribute('aria-current', 'page');
});

test('cada foto lleva su crédito', async ({ page }) => {
  await page.goto('/lugares/la-ermita');
  await expect(page.getByText(/Foto:/).first()).toBeVisible();
  await page.goto('/acerca#fotos');
  const creditos = page.locator('#fotos .celdas li');
  expect(await creditos.count()).toBeGreaterThan(30);
});
