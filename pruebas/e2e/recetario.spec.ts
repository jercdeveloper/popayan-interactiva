import { test, expect } from '@playwright/test';

test.describe('Recetario vivo', () => {
  test('los ingredientes se marcan mientras se cocina', async ({ page }) => {
    await page.goto('/recetario/pipian');
    const primero = page.locator('.ingredientes input').first();
    await page.locator('.ingredientes label').first().click();
    await expect(primero).toBeChecked();
    await page.locator('.ingredientes label').first().click();
    await expect(primero).not.toBeChecked();
    await expect(page.locator('.pasos li')).toHaveCount(6);
  });

  test('sin pasos documentados, la receta solo dice lo que lleva', async ({ page }) => {
    await page.goto('/recetario/salpicon-de-baudilia');
    await expect(page.getByRole('heading', { name: 'Lo que lleva' })).toBeVisible();
    await expect(page.locator('.ingredientes input')).toHaveCount(0);
    await expect(page.locator('.pasos')).toHaveCount(0);
  });

  test('la receta lleva al lugar donde probarla, y el lugar a la receta', async ({ page }) => {
    await page.goto('/recetario/empanadas-de-pipian');
    await page.getByRole('link', { name: /La Fresa/ }).click();
    await expect(page).toHaveURL(/\/lugares\/la-fresa$/);
    await expect(page.getByRole('heading', { name: 'Aquí se prueba' })).toBeVisible();
    await page.getByRole('link', { name: /Empanadas de pipián/ }).click();
    await expect(page).toHaveURL(/\/recetario\/empanadas-de-pipian$/);
  });

  test('la ruta gastronómica lleva al recetario', async ({ page }) => {
    await page.goto('/rutas/gastronomia');
    await page.getByRole('link', { name: /Recetario vivo/ }).click();
    await expect(page).toHaveURL(/\/recetario$/);
  });
});
