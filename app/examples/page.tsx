'use client';

import Link from 'next/link';
import { FaAws } from 'react-icons/fa';
import { SiGooglecloud } from 'react-icons/si';

export default function ExamplesPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-0">
      <h1 className="text-4xl font-bold mb-8">Ejemplos de Infraestructura Cloud</h1>
      <p className="text-lg mb-12 max-w-3xl">
        Explora ejemplos interactivos de arquitecturas cloud usando Aether. 
        Estos diagramas son totalmente editables - arrastra los nodos, crea nuevas conexiones,
        y visualiza tus propias arquitecturas cloud.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* AWS Example Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <FaAws size={32} className="text-orange-500" />
              <h2 className="text-2xl font-bold">AWS</h2>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">Arquitectura Web en AWS</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Aplicación web con balanceo de carga, servidor web redundante, base de datos RDS 
              y procesamiento de archivos con S3 y Lambda.
            </p>
            <Link 
              href="/examples/aws" 
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Ver ejemplo
            </Link>
          </div>
        </div>

        {/* GCP Example Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <SiGooglecloud size={32} className="text-blue-500" />
              <h2 className="text-2xl font-bold">Google Cloud</h2>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">Arquitectura Web en GCP</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Aplicación web escalable con Load Balancer global, Compute Engine, 
              Cloud SQL, Cloud Storage y Cloud Functions para procesamiento.
            </p>
            <Link 
              href="/examples/gcp" 
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Ver ejemplo
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg max-w-4xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-3">Acerca de estos ejemplos</h3>
        <p className="mb-4">
          Estos ejemplos utilizan React Flow para crear diagramas interactivos de infraestructura cloud.
          Puedes modificar estos diagramas de las siguientes formas:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Arrastra los nodos para reorganizar el diagrama</li>
          <li>Conecta recursos manteniendo presionado y arrastrando desde un punto de conexión (círculo) a otro</li>
          <li>Guarda tu diagrama haciendo clic en el botón 'Save' (esto exportará la configuración a la consola)</li>
        </ul>
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Estos ejemplos ilustran cómo Aether puede visualizar y gestionar tu infraestructura cloud a través
          de una interfaz intuitiva.
        </p>
      </div>
    </div>
  );
}