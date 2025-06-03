'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  
  // Hide navigation on login and register pages
  const hideNavigation = pathname === '/login' || pathname === '/register';
  
  if (hideNavigation) return null;
  
  // Determine if we are on the main marketing page (/) to show specific links
  const isOnMarketingPage = pathname === '/';

  return (
    <nav className="fixed w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 py-4 px-6 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href={isOnMarketingPage ? "/" : "/dashboard"} className="text-xl font-bold text-electric-purple-600 dark:text-electric-purple-400">
          InfraUX
        </Link>
        {isOnMarketingPage && (
          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400">Features</a>
            <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400">Docs</a>
            <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400">About</a>
            <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400">Blog</a>
          </div>
        )}
        {/* Mostrar botones de Login/Sign Up solo en la página de marketing '/' */}
        {isOnMarketingPage && (
          <div className="flex gap-4 items-center">
            <Link 
              href="/login" 
              className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="bg-electric-purple-600 text-white hover:bg-electric-purple-700 dark:bg-electric-purple-500 dark:hover:bg-electric-purple-600 transition-colors px-4 py-2 text-sm font-medium rounded-md"
            >
              Sign Up
            </Link>
          </div>
        )}
        {/* Aquí se podrían añadir otros elementos de navegación para cuando el usuario está logueado y no está en '/' */}
        {/* Por ejemplo, un menú de usuario, si !isOnMarketingPage && !hideNavigation */}
      </div>
    </nav>
  );
}
