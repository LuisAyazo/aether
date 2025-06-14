import { test, expect } from '@playwright/test';
import { loginAsUser, createTestCompany, cleanupTestData } from '../helpers/test-utils';

test.describe('Diagram Creation Flow', () => {
  let companyId: string | null;

  test.beforeEach(async ({ page }) => {
    // Setup: Create test company and login
    companyId = await createTestCompany(page, 'Test Company');
    await loginAsUser(page, 'test@infraux.com', 'testpass123');
    await page.goto('/dashboard');
  });

  test.afterEach(async ({ page }) => {
    if (companyId) {
      await cleanupTestData(page, companyId);
    }
  });

  test('creates a new diagram with AWS resources', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('text=Diagramas')).toBeVisible();
    
    // Create new environment
    await page.click('button[aria-label="Crear Nuevo Ambiente"]');
    await page.fill('input[name="environmentName"]', 'Production');
    await page.click('button:has-text("Crear Ambiente")');
    
    // Wait for environment creation
    await expect(page.locator('text=Production')).toBeVisible({ timeout: 10000 });
    
    // Create new diagram
    await page.click('button[aria-label="Crear Nuevo Diagrama"]');
    await page.fill('input[name="diagramName"]', 'API Infrastructure');
    await page.fill('textarea[name="diagramDescription"]', 'Main API architecture');
    await page.click('button:has-text("Crear Diagrama")');
    
    // Wait for diagram editor to load
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 });
    
    // Add AWS Lambda resource
    await page.click('text=AWS - Aplicación');
    await page.dragAndDrop(
      'text=Lambda Function',
      '.react-flow__viewport',
      { targetPosition: { x: 300, y: 200 } }
    );
    
    // Add S3 Bucket
    await page.click('text=AWS - Almacenamiento');
    await page.dragAndDrop(
      'text=S3 Bucket',
      '.react-flow__viewport',
      { targetPosition: { x: 500, y: 200 } }
    );
    
    // Connect nodes
    await page.click('.source-handle-right');
    await page.click('.target-handle-left');
    
    // Verify nodes and edge are created
    await expect(page.locator('.react-flow__node')).toHaveCount(2);
    await expect(page.locator('.react-flow__edge')).toHaveCount(1);
    
    // Save diagram
    await page.keyboard.press('Control+S');
    await expect(page.locator('text=Diagrama guardado')).toBeVisible();
  });

  test('generates infrastructure code', async ({ page }) => {
    // Navigate to existing diagram
    await page.click('text=API Infrastructure');
    
    // Click generate code button
    await page.click('button:has-text("Ver Código")');
    
    // Verify code modal appears
    await expect(page.locator('.code-modal')).toBeVisible();
    
    // Check terraform tab
    await page.click('text=Terraform');
    await expect(page.locator('code')).toContainText('resource "aws_lambda_function"');
    await expect(page.locator('code')).toContainText('resource "aws_s3_bucket"');
    
    // Check CloudFormation tab
    await page.click('text=CloudFormation');
    await expect(page.locator('code')).toContainText('AWS::Lambda::Function');
    await expect(page.locator('code')).toContainText('AWS::S3::Bucket');
  });
});
