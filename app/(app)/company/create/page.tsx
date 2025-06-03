'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCompany } from '../../../services/companyService'; // Corregida ruta
import { isAuthenticated } from '../../../services/authService'; // Corregida ruta

export default function CreateCompany() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  useEffect(() => {
    // Generar slug automáticamente basado en el nombre
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    
    setSlug(generatedSlug);
  }, [name]);
  
  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // El backend espera un objeto con name, description (opcional), logo_url (opcional)
      // El slug no se envía al backend para la creación de la compañía.
      const company = await createCompany({ name: name }); 
      
      // Verificar que tengamos un ID válido antes de navegar
      if (company && company._id) {
        console.log('Compañía creada con éxito, redirigiendo a:', `/company/${company._id}`);
        
        // Asegurar que el ID esté presente en localStorage antes de navegar
        localStorage.setItem('lastCreatedCompany', JSON.stringify(company));
        
        // Redirigir al dashboard de la compañía
        router.push(`/company/${company._id}`);
      } else {
        console.error('Error: La compañía creada no tiene un ID válido', company);
        setError('La compañía se creó pero no se pudo obtener su ID. Intente acceder desde el dashboard.');
        
        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => router.push('/dashboard'), 3000);
      }
    } catch (err: any) {
      console.error('Error al crear compañía:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
                  Aether
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Crear Nueva Compañía
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Esta compañía será el contenedor para tus diagramas de arquitectura.
                El slug se usará en las URLs para acceder a los recursos de la compañía.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 bg-white dark:bg-gray-800 sm:p-6">
                  {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre de la compañía
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="col-span-6">
                      <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Slug (URL)
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                          aether.io/
                        </span>
                        <input
                          type="text"
                          id="slug"
                          name="slug"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          required
                          className="flex-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-none rounded-r-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
                  <Link
                    href="/dashboard"
                    className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Creando...' : 'Crear Compañía'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
