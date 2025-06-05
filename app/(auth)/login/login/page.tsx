'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Importar useSearchParams
import Link from 'next/link';
import Image from 'next/image'; // Importar Image de next/image
import { loginUser, saveAuthData } from '../services/authService';

// Icono de Google (SVG simple)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.48-1.94 3.23v2.72h3.5c2.04-1.88 3.22-4.76 3.22-8.02z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.5-2.72c-.98.66-2.23 1.06-3.78 1.06-2.9 0-5.36-1.95-6.24-4.58H2.07v2.81C3.97 20.98 7.72 23 12 23z" />
    <path d="M5.76 14.01C5.56 13.38 5.46 12.71 5.46 12s.1-.68.3-1.3l-.01-.01L2.07 7.9C1.22 9.44.72 11.17.72 13s.5 3.56 1.35 5.1l3.69-2.8z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.13-3.13C17.45 2.09 14.97 1 12 1 7.72 1 3.97 3.02 2.07 6.1l3.69 2.81c.88-2.63 3.34-4.53 6.24-4.53z" />
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>
);

// Icono de GitHub (SVG simple)
const GitHubIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook para leer query params

  // Verificar si hay un mensaje de registro exitoso
  const registrationSuccess = searchParams.get('registered') === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUser(email, password);
      saveAuthData(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  }

  // TODO: Implementar lógica de login con Google y GitHub
  const handleGoogleLogin = () => {
    // Redirigir a la ruta de autenticación de Google en el backend
    // Ejemplo: window.location.href = '/api/auth/google';
    setError('Inicio de sesión con Google aún no implementado.');
  };

  const handleGitHubLogin = () => {
    // Redirigir a la ruta de autenticación de GitHub en el backend
    // Ejemplo: window.location.href = '/api/auth/github';
    // Ya existe una ruta en infraux/app/api/auth/github/route.ts que podría usarse
    // Esta ruta espera companyId, así que habría que manejar ese flujo o crear una ruta de login genérica.
    // Por ahora, solo mostramos un mensaje.
    router.push('/api/auth/github'); // Asumiendo que esta ruta inicia el flujo OAuth
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-800 p-4 font-inter">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Image 
            src="/logo-infraux-purple.svg" 
            alt="InfraUX Logo" 
            width={80} 
            height={80} 
            className="mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-electric-purple-600 dark:text-electric-purple-400">
            Bienvenido a InfraUX
          </h1>
          <p className="mt-3 text-md text-gray-600 dark:text-gray-300">
            Visualiza y gestiona tu infraestructura cloud.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
          {registrationSuccess && (
            <div className="bg-emerald-green-50 border border-emerald-green-200 text-emerald-green-700 px-4 py-3 rounded-md relative" role="alert">
              <strong className="font-bold">¡Registro exitoso!</strong>
              <span className="block sm:inline"> Ahora puedes iniciar sesión.</span>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-electric-purple-500 focus:border-electric-purple-500 sm:text-sm"
                placeholder="tu@ejemplo.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-electric-purple-500 focus:border-electric-purple-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {/* <a href="#" className="font-medium text-cloud-blue-600 hover:text-cloud-blue-500 dark:text-cloud-blue-400 dark:hover:text-cloud-blue-300">
                  ¿Olvidaste tu contraseña?
                </a> */}
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-electric-purple-600 hover:bg-electric-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-purple-500 disabled:opacity-70 transition-colors duration-150"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                O continúa con
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cloud-blue-500 transition-colors duration-150"
            >
              <GoogleIcon />
              Iniciar sesión con Google
            </button>
            <button
              type="button"
              onClick={handleGitHubLogin}
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
            >
              <GitHubIcon />
              Iniciar sesión con GitHub
            </button>
          </div>
          
          <div className="mt-6 text-sm text-center">
            <p className="text-gray-600 dark:text-gray-400">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="font-medium text-electric-purple-600 hover:text-electric-purple-500 dark:text-electric-purple-400 dark:hover:text-electric-purple-300">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
