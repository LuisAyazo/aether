/**
 * Selectores centralizados para tests E2E
 * Usa múltiples estrategias para mayor robustez
 */
export const selectors = {
  login: {
    // Inputs
    emailInput: [
      '[data-testid="login-email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="correo" i]',
      'input[name="email"]',
      '#email'
    ].join(', '),
    
    passwordInput: [
      '[data-testid="login-password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="contraseña" i]',
      'input[name="password"]',
      '#password'
    ].join(', '),
    
    // Buttons
    submitButton: [
      '[data-testid="login-submit"]',
      'button[type="submit"]',
      'button:has-text("Iniciar Sesión")',
      'button:has-text("Login")',
      'button:has-text("Entrar")'
    ].join(', '),
    
    googleButton: [
      '[data-testid="login-google"]',
      'button:has-text("Google")',
      'button:has-text("Iniciar sesión con Google")'
    ].join(', '),
    
    githubButton: [
      '[data-testid="login-github"]',
      'button:has-text("GitHub")',
      'button:has-text("Iniciar sesión con GitHub")'
    ].join(', '),
    
    // Links
    registerLink: [
      '[data-testid="login-register-link"]',
      'a:has-text("Regístrate")',
      'a:has-text("Crear cuenta")',
      'a:has-text("Sign up")',
      'a[href*="register"]'
    ].join(', '),
    
    forgotPasswordLink: [
      '[data-testid="login-forgot-password"]',
      'a:has-text("Olvidaste")',
      'a:has-text("Forgot")',
      'a[href*="forgot"]',
      'a[href*="reset"]'
    ].join(', '),
    
    // Messages
    errorMessage: [
      '[data-testid="login-error"]',
      '.error-message',
      '[role="alert"]',
      '.text-red-500',
      '.text-danger'
    ].join(', ')
  },
  
  register: {
    nameInput: [
      '[data-testid="register-name"]',
      'input[placeholder*="nombre" i]',
      'input[placeholder*="name" i]',
      'input[name="name"]',
      'input[name="fullName"]'
    ].join(', '),
    
    emailInput: [
      '[data-testid="register-email"]',
      'input[type="email"]',
      'input[name="email"]'
    ].join(', '),
    
    passwordInput: [
      '[data-testid="register-password"]',
      'input[type="password"]',
      'input[name="password"]'
    ].join(', '),
    
    submitButton: [
      '[data-testid="register-submit"]',
      'button[type="submit"]',
      'button:has-text("Crear Cuenta")',
      'button:has-text("Registrar")',
      'button:has-text("Sign up")'
    ].join(', ')
  },
  
  dashboard: {
    welcomeMessage: [
      '[data-testid="dashboard-welcome"]',
      'h1:has-text("Bienvenido")',
      'h1:has-text("Welcome")',
      'h1:has-text("Dashboard")'
    ].join(', '),
    
    logoutButton: [
      '[data-testid="logout-button"]',
      'button:has-text("Cerrar sesión")',
      'button:has-text("Logout")',
      'button:has-text("Salir")'
    ].join(', '),
    
    companySelector: [
      '[data-testid="company-selector"]',
      'select[name="company"]',
      '[aria-label="Seleccionar empresa"]'
    ].join(', '),
    
    companyName: [
      '[data-testid="company-name"]',
      '.company-name',
      'span:has-text("Empresa:")'
    ].join(', ')
  },
  
  onboarding: {
    personalOption: [
      '[data-testid="usage-personal"]',
      'button:has-text("Personal")',
      'button:has-text("Individual")',
      'div:has-text("Personal") button',
      '[value="personal"]'
    ].join(', '),
    
    companyOption: [
      '[data-testid="usage-company"]',
      'button:has-text("Empresa")',
      'button:has-text("Company")',
      'button:has-text("Equipo")',
      'div:has-text("Empresa") button',
      '[value="company"]'
    ].join(', '),
    
    continueButton: [
      '[data-testid="onboarding-continue"]',
      'button:has-text("Continuar")',
      'button:has-text("Siguiente")',
      'button:has-text("Next")'
    ].join(', ')
  },
  
  createCompany: {
    nameInput: [
      '[data-testid="company-name-input"]',
      'input[name="companyName"]',
      'input[placeholder*="empresa" i]',
      'input[placeholder*="company" i]'
    ].join(', '),
    
    submitButton: [
      '[data-testid="create-company-submit"]',
      'button:has-text("Crear")',
      'button:has-text("Create")',
      'button[type="submit"]'
    ].join(', ')
  }
};