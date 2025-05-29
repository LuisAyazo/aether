'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCompanies, Company } from '../services/companyService';
import { getCurrentUser, isAuthenticated, logoutUser } from '../services/authService';
import { PlusIcon } from '@heroicons/react/24/outline';
import { FaAws } from 'react-icons/fa';
import { SiGooglecloud } from 'react-icons/si';

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  // No llamar a getCurrentUser() durante la renderización inicial
  const [user, setUser] = useState<{name?: string} | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  
  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    // Obtenemos el usuario después de la renderización inicial
    setUser(getCurrentUser());
    
    // Cargar las compañías del usuario
    async function loadCompanies() {
      try {
        const data = await getCompanies();
        setCompanies(data);
        // Si el usuario no tiene compañías, consideramos que es su primer login
        if (data.length === 0) {
          setIsFirstLogin(true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadCompanies();
  }, [router]);
  
  function handleLogout() {
    logoutUser();
    router.push('/login');
  }
  
  // Si es el primer login, mostramos solo la pantalla para crear una compañía
  if (isFirstLogin && !loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">¡Bienvenido a Aether!</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
            Para comenzar, crea tu primera compañía.
          </p>
          <Link
            href="/company/create"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear mi primera compañía
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Aether</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-300 mr-4">{user?.name || 'Usuario'}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Compañías</h2>
          <Link
            href="/company/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Compañía
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Cargando compañías...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600 dark:text-gray-400">No tienes compañías creadas.</p>
            <Link
              href="/company/create"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              Crear tu primera compañía
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Link 
                key={company._id} 
                href={`/company/${company._id}`}
                className="block bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{company.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(company.created_at).toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-indigo-500 hover:text-indigo-600">
                    <span>Ver diagramas</span>
                    <span className="ml-1">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ejemplos de Infraestructura Cloud</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400">
              <div className="min-w-0 flex-1">
                <a href="#" className="focus:outline-none">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">AWS Resources</p>
                  <p className="truncate text-sm text-gray-500">View AWS resources</p>
                </a>
              </div>
            </div>

            <div className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400">
              <div className="min-w-0 flex-1">
                <a href="#" className="focus:outline-none">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">GCP Resources</p>
                  <p className="truncate text-sm text-gray-500">View GCP resources</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}