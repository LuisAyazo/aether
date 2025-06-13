import { Page } from '@playwright/test';

export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function createTestCompany(page: Page, companyName: string) {
  await page.goto('/create-company');
  await page.fill('input[name="name"]', companyName);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  
  // Extraer el ID de la compañía de la URL o del DOM
  const companyId = await page.evaluate(() => {
    // Esto dependerá de cómo se almacene el ID en tu aplicación
    return localStorage.getItem('activeCompanyId');
  });
  
  return companyId;
}

export async function cleanupTestData(page: Page, companyId: string) {
  // Implementar la lógica de limpieza según tu backend
  // Por ejemplo, hacer una llamada API para eliminar la compañía de prueba
  await page.evaluate(async (id) => {
    await fetch(`/api/companies/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }, companyId);
}