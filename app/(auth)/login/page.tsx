'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Network } from 'lucide-react'; // Importar el icono de nodo
import { loginUser, saveAuthData, loginWithGoogle, loginWithGitHub } from '../../services/authService';

// Icono de Google (SVG simple)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.48-1.94 3.23v2.72h3.5c2.04-1.88 3.22-4.76 3.22-8.02z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.5-2.72c-.98.66-2.23 1.06-3.78 1.06-2.9 0-5.36-1.95-6.24-4.58H2.07v2.81C3.97 20.98 7.72 23 12 23z" />
    <path d="M5.76 14.01C5.56 13.38 5.46 12.71 5.46 12s.1-.68.3-1.3l-.01-.01L2.07 7.9C1.22 9.44.72 11.17.72 13s.5 3.56 1.35 5.1l3.69-2.8z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.13-3.13C17.45 2.09 14.97 1 12 1 7.72 1 3.97 3.02 2.07 6.1l3.69 2.81c.88-2.63 3.34-4.53 6.24-4.53z" />
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>
);

// Icono de GitHub (SVG simple)
const GitHubIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const registrationSuccess = searchParams.get('registered') === 'true';
  const emailConfirmed = searchParams.get('confirmed') === 'true';
  const authError = searchParams.get('error');
  const sessionExpired = searchParams.get('session_expired') === 'true';

  // Show session expired message
  if (sessionExpired && !error) {
    setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }

  // Show auth errors from OAuth callbacks
  if (authError && !error) {
    if (authError === 'auth_failed') {
      setError('Error al autenticar con el proveedor. Por favor, intenta de nuevo.');
    } else if (authError === 'unexpected') {
      setError('Error inesperado durante la autenticación.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate email before sending
    if (!email || !email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      setLoading(false);
      return;
    }
    
    if (!password) {
      setError('Por favor ingresa tu contraseña');
      setLoading(false);
      return;
    }
    
    console.log('[LOGIN PAGE] Attempting login with email:', email);
    
    try {
      const data = await loginUser(email.trim(), password);
      saveAuthData(data);
      
      // Check if user needs onboarding or company creation
      if (data.user) {
        // Import getAuthTokenAsync dynamically to avoid circular dependencies
        const { getAuthTokenAsync } = await import('../../services/authService');
        
        // Check if user has companies (could be an invited user)
        try {
          const token = await getAuthTokenAsync();
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const companiesResponse = await fetch(`${API_URL}/api/v1/auth/me/companies`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (companiesResponse.ok) {
            const companiesData = await companiesResponse.json();
            console.log('[LOGIN PAGE] User companies:', companiesData);
            
            // If user has companies but first_company_created is false, they're an invited member
            if (companiesData.count > 0 && !data.user.first_company_created) {
              console.log('[LOGIN PAGE] User is invited member, updating first_company_created');
              
              // Update the user profile
              const updateResponse = await fetch(`${API_URL}/api/v1/auth/me/usage-settings`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  usage_type: 'company'
                }),
              });
              
              if (updateResponse.ok) {
                const updatedUser = await updateResponse.json();
                data.user = { ...data.user, ...updatedUser };
                saveAuthData({ ...data, user: data.user });
              }
            }
          }
        } catch (error) {
          console.error('[LOGIN PAGE] Error checking user companies:', error);
        }
        
        // Now redirect based on updated user state
        if (!data.user.onboarding_completed) {
          // Paso 1: Onboarding
          console.log('[LOGIN PAGE] User needs onboarding, redirecting...');
          router.push('/onboarding/select-usage');
        } else if (data.user.usage_type === 'company' && !data.user.first_company_created) {
          // Paso 2: Usuarios company necesitan crear su primera compañía
          console.log('[LOGIN PAGE] Company user needs to create first company, redirecting...');
          router.push('/company/create');
        } else {
          // Paso 3: Todo completado, ir al dashboard
          console.log('[LOGIN PAGE] User ready for dashboard, redirecting...');
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('[LOGIN PAGE] Login error:', err);
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Use Supabase OAuth login
      await loginWithGoogle();
      // Note: The user will be redirected to Google and then back to /auth/callback
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Use Supabase OAuth login
      await loginWithGitHub();
      // Note: The user will be redirected to GitHub and then back to /auth/callback
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con GitHub');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row w-full max-w-5xl lg:max-w-6xl mx-auto shadow-2xl rounded-xl my-8 md:my-0 overflow-hidden"> {/* Added overflow-hidden here */}
        
        {/* Columna Izquierda: Formulario de Login */}
        <div className="w-full md:w-1/2 bg-white dark:bg-slate-800 p-8 sm:p-10 lg:p-12 flex flex-col justify-center animate-fade-in">
          <div className="text-center mb-8 sm:mb-10">
            <div className="mx-auto mb-3 text-5xl sm:text-6xl font-bold">
              <span className="text-slate-900 dark:text-slate-100">Infra</span>
              <span className="bg-gradient-to-r from-emerald-green-500 via-emerald-green-600 to-emerald-green-700 bg-clip-text text-transparent">UX</span>
            </div>
            <p className="text-md text-gray-600 dark:text-gray-400">
              Accede para visualizar y gestionar tu infraestructura cloud.
            </p>
          </div>

          {registrationSuccess && (
            <div className="mb-6 bg-emerald-green-50 border border-emerald-green-300 text-emerald-green-700 dark:bg-emerald-green-900/50 dark:border-emerald-green-700 dark:text-emerald-green-200 px-4 py-3 rounded-md relative animate-fade-in" style={{ animationDelay: '0.1s' }} role="alert">
              <strong className="font-bold">¡Registro exitoso!</strong>
              <span className="block sm:inline"> Ahora puedes iniciar sesión.</span>
            </div>
          )}
          {emailConfirmed && (
            <div className="mb-6 bg-emerald-green-50 border border-emerald-green-300 text-emerald-green-700 dark:bg-emerald-green-900/50 dark:border-emerald-green-700 dark:text-emerald-green-200 px-4 py-3 rounded-md relative animate-fade-in" style={{ animationDelay: '0.1s' }} role="alert">
              <strong className="font-bold">¡Correo confirmado!</strong>
              <span className="block sm:inline"> Tu cuenta ha sido verificada. Ya puedes iniciar sesión.</span>
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200 px-4 py-3 rounded-md relative animate-fade-in" style={{ animationDelay: '0.1s' }} role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-electric-purple-500 focus:border-electric-purple-500 sm:text-sm transition-colors"
                placeholder="tu@ejemplo.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-electric-purple-500 focus:border-electric-purple-500 sm:text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-electric-purple-600 hover:bg-electric-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-purple-500 disabled:opacity-70 transition-all duration-150 ease-in-out transform hover:scale-105"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="relative my-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                O continúa con
              </span>
            </div>
          </div>

          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cloud-blue-500 transition-all duration-150 ease-in-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              Iniciar sesión con Google
            </button>
            <button
              type="button"
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-150 ease-in-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <GitHubIcon />
              Iniciar sesión con GitHub
            </button>
          </div>
          
          <div className="mt-8 text-sm text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-gray-600 dark:text-gray-400">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="font-medium text-electric-purple-600 hover:text-electric-purple-500 dark:text-electric-purple-400 dark:hover:text-electric-purple-300 underline hover:no-underline">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div> {/* Fin Columna Izquierda */}

        {/* Columna Derecha: Atractivo Visual */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-electric-purple-800 to-emerald-green-800 p-8 sm:p-12 lg:p-16 flex-col justify-center items-center text-center animate-fade-in relative" style={{ animationDelay: '0.2s' }}>
          <div className="relative z-10 group transform transition-all duration-500 hover:scale-105"> {/* Añadido group aquí y z-10 */}
            <div className="mx-auto mb-6 text-6xl lg:text-7xl font-bold">
                <span className="text-slate-100">Infra</span>
                <span className="bg-gradient-to-r from-emerald-green-400 via-emerald-green-500 to-green-400 bg-clip-text text-transparent">UX</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4">
              Visualiza. Construye. Domina.
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Transforma la complejidad de la nube en claridad visual. Tu infraestructura, simplificada.
            </p>
            <Link 
              href="/#what-is-infraux" // Enlace a una sección de la landing page
              className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium py-3 px-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Descubre Más
            </Link>
            {/* Icono de Nodo */}
            <div className="mt-12 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
              <Network 
                className="w-28 h-28 lg:w-36 lg:h-36 text-emerald-green-400/60 group-hover:text-emerald-green-400/80 transition-all duration-500 transform group-hover:scale-110" 
                strokeWidth={1.25} 
              />
            </div>
          </div>
        </div> {/* Fin Columna Derecha */}

      </div> {/* Fin Contenedor Principal Flex */}
    </div> /* Fin Contenedor Root */
  );
}
