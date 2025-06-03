'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, User as UserIcon } from 'lucide-react'; // Iconos para los botones
import { getCurrentUser, getAuthToken, User } from '../../../services/authService'; // Ruta corregida y User importado de aquí

// Necesitaríamos una función para actualizar las settings de uso
// Esto podría estar en authService.ts o un nuevo userService.ts
async function updateUserUsageSettings(usageType: 'personal' | 'company', token: string | null) {
  if (!token) throw new Error('No autenticado');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${API_URL}/api/v1/auth/me/usage-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ usage_type: usageType }), // selected_company_id se manejará después si es 'company'
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error al actualizar las preferencias de uso');
  }
  return response.json();
}


export default function SelectUsagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<'personal' | 'company' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Si ya tiene un usage_type, no debería estar en esta página, redirigir.
      // (Esta lógica también podría estar en un HOC o en el layout de la app)
      if (user.usage_type) {
        router.replace('/dashboard'); // O a la página de compañía si es relevante
      }
    } else {
      // Si no hay usuario, redirigir a login
      router.replace('/login');
    }
  }, [router]);

  const handleSelectUsage = async (usageType: 'personal' | 'company') => {
    setLoading(usageType);
    setError(null);
    const token = getAuthToken();

    try {
      const updatedUser = await updateUserUsageSettings(usageType, token);
      // Actualizar el usuario en localStorage (authService debería tener una función para esto)
      // Por ahora, asumimos que el backend devuelve el usuario actualizado y lo usamos para redirigir.
      // Opcionalmente, se puede llamar a /me para obtener el usuario actualizado.
      
      // Actualizar localStorage (simplificado, idealmente authService.saveAuthData se actualiza o se crea una nueva función)
      if (typeof window !== 'undefined' && updatedUser) {
         const existingUser = getCurrentUser();
         if (existingUser) {
            const newUserData = { ...existingUser, ...updatedUser };
            localStorage.setItem('user', JSON.stringify(newUserData));
         }
      }


      if (usageType === 'personal') {
        router.push('/dashboard'); // Redirigir al dashboard personal
      } else { // company
        router.push('/company/create'); // Redirigir a crear compañía
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error.');
    } finally {
      setLoading(null);
    }
  };

  if (!currentUser || currentUser.usage_type) {
    // Muestra un loader o nada mientras redirige si el usuario no debería estar aquí.
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 font-sans">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-8 text-6xl sm:text-7xl font-bold">
          <span className="text-slate-900 dark:text-slate-100">Infra</span>
          <span className="bg-gradient-to-r from-emerald-green-500 via-emerald-green-600 to-emerald-green-700 bg-clip-text text-transparent">UX</span>
        </div>
        
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
          ¡Bienvenido a InfraUX!
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
          Para personalizar tu experiencia, por favor cuéntanos cómo planeas usar la plataforma.
        </p>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleSelectUsage('personal')}
            disabled={!!loading}
            className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-70 group"
          >
            <UserIcon className="w-16 h-16 mb-4 text-electric-purple-500 group-hover:text-electric-purple-600 transition-colors" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Uso Personal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ideal para proyectos individuales y aprendizaje.
            </p>
            {loading === 'personal' && <span className="mt-2 text-sm text-electric-purple-600">Procesando...</span>}
          </button>

          <button
            onClick={() => handleSelectUsage('company')}
            disabled={!!loading}
            className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-70 group"
          >
            <Building className="w-16 h-16 mb-4 text-emerald-green-500 group-hover:text-emerald-green-600 transition-colors" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Uso de Compañía</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Colabora con tu equipo y gestiona proyectos empresariales.
            </p>
            {loading === 'company' && <span className="mt-2 text-sm text-emerald-green-600">Procesando...</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
