'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Network } from 'lucide-react'; // Para la columna derecha
import { registerUser } from '../../services/authService'; // Ruta corregida

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      await registerUser(name, email, password);
      router.push('/login?registered=true'); // Redirigir a login con mensaje
    } catch (err: any) {
      setError(err.message || 'Error al registrar el usuario. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row w-full max-w-5xl lg:max-w-6xl mx-auto shadow-2xl rounded-xl my-8 md:my-0 overflow-hidden">
        
        {/* Columna Izquierda: Formulario de Registro */}
        <div className="w-full md:w-1/2 bg-white dark:bg-slate-800 p-8 sm:p-10 lg:p-12 flex flex-col justify-center animate-fade-in">
          <div className="text-center mb-8 sm:mb-10">
            <div className="mx-auto mb-3 text-5xl sm:text-6xl font-bold">
              <span className="text-slate-900 dark:text-slate-100">Infra</span>
              <span className="bg-gradient-to-r from-emerald-green-500 via-emerald-green-600 to-emerald-green-700 bg-clip-text text-transparent">UX</span>
            </div>
            <p className="text-md text-gray-600 dark:text-gray-400">
              Crea tu cuenta para empezar a visualizar y gestionar tu infraestructura.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200 px-4 py-3 rounded-md relative animate-fade-in" style={{ animationDelay: '0.1s' }} role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-electric-purple-500 focus:border-electric-purple-500 sm:text-sm transition-colors"
                placeholder="Tu Nombre Completo"
              />
            </div>

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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-electric-purple-500 focus:border-electric-purple-500 sm:text-sm transition-colors"
                placeholder="•••••••• (mín. 8 caracteres)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                ) : 'Crear Cuenta'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-sm text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-gray-600 dark:text-gray-400">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-medium text-electric-purple-600 hover:text-electric-purple-500 dark:text-electric-purple-400 dark:hover:text-electric-purple-300 underline hover:no-underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div> {/* Fin Columna Izquierda */}

        {/* Columna Derecha: Atractivo Visual (Idéntica a la de LoginPage) */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-electric-purple-800 to-emerald-green-800 p-8 sm:p-12 lg:p-16 flex-col justify-center items-center text-center animate-fade-in relative" style={{ animationDelay: '0.2s' }}>
          <div className="relative z-10 group transform transition-all duration-500 hover:scale-105">
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
              href="/#what-is-infraux" 
              className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium py-3 px-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Descubre Más
            </Link>
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
