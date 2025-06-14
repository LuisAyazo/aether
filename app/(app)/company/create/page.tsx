'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createCompany, PERSONAL_SPACE_COMPANY_NAME_PREFIX } from '../../../services/companyService';
import { fetchAndUpdateCurrentUser, getCurrentUser, User, isAuthenticated } from '../../../services/authService';

export default function CreateCompanyPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPersonalSpaceSetup, setIsPersonalSpaceSetup] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Mensajes de carga progresivos
  const loadingMessages = [
    'Creando tu organización...',
    'Configurando tu workspace...',
    'Preparando el entorno de trabajo...',
    'Estableciendo permisos...',
    'Iniciando servicios...',
    'Casi listo...',
    'Finalizando configuración...'
  ];

  // Debug script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/debug-create-company.js';
    document.head.appendChild(script);
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Verificación de autenticación y onboarding
  useEffect(() => {
    // Verificación síncrona primero para evitar delays
    const authenticated = isAuthenticated();
    const user = getCurrentUser();
    
    if (!authenticated || !user) {
      console.log('[CREATE-COMPANY] Usuario no autenticado, redirigiendo a login');
      router.replace('/login');
      return;
    }

    // IMPORTANTE: Verificar que el usuario haya completado el onboarding
    if (!user.usage_type) {
      console.log('[CREATE-COMPANY] Usuario sin usage_type, redirigiendo a onboarding');
      router.replace('/onboarding/select-usage');
      return;
    }

    // TODO: Verificar si el usuario personal ya tiene compañía
    // Por ahora, permitimos que usuarios personales creen múltiples compañías
    
    setCurrentUser(user);
    setAuthChecking(false);
  }, [router]);

  useEffect(() => {
    if (!authChecking && currentUser) {
      const setupPersonalQuery = searchParams.get('setup_personal_space');
      if (setupPersonalQuery === 'true') {
        setIsPersonalSpaceSetup(true);
        setName(`${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${currentUser._id}`);
      }
    }
  }, [searchParams, currentUser, authChecking]);
  
  useEffect(() => {
    if (isPersonalSpaceSetup) return; // No generar slug si es setup de espacio personal
    // Generar slug automáticamente basado en el nombre
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    
    setSlug(generatedSlug);
  }, [name, isPersonalSpaceSetup]);
  
  // Efecto para cambiar los mensajes de carga
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000); // Cambiar mensaje cada 2 segundos

      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [loading, loadingMessages.length]);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let companyNameForCreation = name;
      if (isPersonalSpaceSetup && currentUser) {
        // Asegurarse de que el nombre para el espacio personal sea el correcto
        companyNameForCreation = `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${currentUser._id}`;
      }

      const company = await createCompany({ name: companyNameForCreation }); 
      
      if (company && (company._id || company.id)) {
        console.log('Compañía creada con éxito. Actualizando sesión de usuario...');
        
        // Marcar que acabamos de crear una compañía
        localStorage.setItem('justCreatedCompany', 'true');
        
        const updatedUser = await fetchAndUpdateCurrentUser();
        
        if (updatedUser) {
          console.log('Sesión de usuario actualizada. Redirigiendo a /dashboard');
          // Usar window.location para una redirección más inmediata
          window.location.href = '/dashboard';
        } else {
          console.error('Error al actualizar la sesión del usuario después de crear la compañía.');
          setError('La compañía se creó, pero hubo un problema al actualizar tu sesión. Por favor, intenta recargar o iniciar sesión de nuevo.');
          // Redirigir de todos modos después de 2 segundos
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        }
      } else {
        console.error('Error: La compañía creada no tiene un ID válido o no se retornó', company);
        setError('La compañía se creó pero no se pudo obtener su ID. Intente acceder desde el dashboard o contacte a soporte.');
        
        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => router.push('/dashboard'), 3000);
      }
    } catch (err: any) {
      console.error('Error al crear compañía:', err);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Ocurrió un error desconocido al crear la compañía.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Mostrar loader mientras se verifica autenticación
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Verificando acceso...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex selection:bg-purple-500 selection:text-white">
      {/* Panel Izquierdo (Oscuro) */}
      <div className="w-2/5 bg-slate-900 dark:bg-black hidden md:flex flex-col items-center justify-center p-12 relative">
        {/* Elementos decorativos o informativos para el panel izquierdo */}
        <div className="text-center">
           <h2 className="text-5xl font-bold text-white">
            <span className="font-extrabold">Infra</span><span className="text-emerald-500 font-semibold">UX</span>
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Visualiza, construye y domina tu infraestructura cloud.
          </p>
          {/* Podrías añadir un gráfico abstracto o ilustración aquí */}
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center text-slate-500 text-xs">
            InfraUX Technologies &copy; {new Date().getFullYear()}
        </div>
      </div>

      {/* Panel Derecho (Contenedor del Formulario) */}
      <div className="w-full md:w-3/5 bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Efecto de gradiente sutil en el panel derecho */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 bg-gradient-to-tr from-purple-200 via-transparent to-indigo-200 dark:from-purple-900/50 dark:via-transparent dark:to-indigo-900/50"></div>
        
        <div 
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-xl p-8 sm:p-10 border border-slate-200 dark:border-slate-700 animate-fade-scale-up" 
        >
          <div className="space-y-6">
            <div>
              <div className="text-center md:hidden mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  <span className="font-extrabold">Infra</span><span className="text-emerald-500 font-semibold">UX</span>
                </h2>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white text-center">
                Crea tu Organización
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 text-center">
                Define los detalles de tu nueva organización en InfraUX.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 p-4 rounded-md" role="alert">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isPersonalSpaceSetup ? "Nombre de tu Espacio Personal (automático)" : "Nombre de la Organización"}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={isPersonalSpaceSetup ? "" : "Ej: Mi Startup Increíble"}
              className="mt-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out text-sm"
              disabled={isPersonalSpaceSetup}
            />
          </div>

          {!isPersonalSpaceSetup && (
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Identificador Único (URL)
              </label>
              <div className="mt-1 flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm">
                  infraux.com/
                </span>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  placeholder="ej-mi-startup"
                  className="flex-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-none rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Será usado en la URL. Se genera a partir del nombre.</p>
            </div>
          )}

          <div className="!mt-12 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-lg shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 transition-colors duration-150"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out group"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {loadingMessages[loadingStep]}
                </>
              ) : (
                <>
                  Continuar
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l4.158-3.87H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
      <div className="md:hidden absolute bottom-6 left-0 right-0 text-center text-xs text-slate-500 dark:text-slate-400 z-0">
        InfraUX Technologies &copy; {new Date().getFullYear()}
      </div>
    </div>
  </div>
  );
}