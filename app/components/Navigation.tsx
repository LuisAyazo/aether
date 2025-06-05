'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Importar useRouter
import { useEffect, useState } from "react"; // Importar useEffect y useState
import { Dropdown, Menu, Avatar, Button, Space } from 'antd'; // Importar componentes de Ant Design
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons'; // Importar iconos
import { getCurrentUser, User, logoutUser as authLogout } from '../services/authService'; // Cambiado logout a logoutUser

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter(); // Hook de router para redirección
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]); // Actualizar usuario si cambia la ruta (ej. después de login)

  const handleLogout = () => {
    authLogout();
    router.push('/login'); // Redirigir a login después de cerrar sesión
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/dashboard?section=profile">Mi Perfil</Link>, // Asumiendo que el dashboard puede manejar secciones
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href="/dashboard?section=settings">Configuración</Link>,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
    },
  ];
  
  const userMenu = <Menu items={userMenuItems} />;

  // Hide navigation on login and register pages
  const hideNavigation = pathname === '/login' || pathname === '/register';
  
  if (hideNavigation) return null;
  
  const isOnMarketingPage = pathname === '/';
  // Estimar la altura del Nav: py-3 (0.75rem * 2 = 1.5rem) + altura del contenido (ej. logo h-7 = 1.75rem). Total ~3.25rem = 52px.
  // El pt-16 en AppLayout es 4rem = 64px.
  // Podríamos hacer el nav un poco más alto o el pt del main más pequeño.
  // Por ahora, mantendré py-3 y ajustaré el pt del main después si es necesario.

  return (
    <nav className="fixed w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-14"> {/* h-14 para altura fija ~56px, px ajustado */}
        <Link href={isOnMarketingPage ? "/" : "/dashboard"} className="text-xl font-bold text-electric-purple-600 dark:text-electric-purple-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          InfraUX
        </Link>
        
        {/* Contenido central para links de marketing y botones de login/signup */}
        <div className="flex-1 flex justify-center">
          {isOnMarketingPage && (
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Features</a>
              <Link href="/docs" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Docs</Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">About</Link>
              <Link href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Blog</Link>
            </div>
          )}
        </div>
        
        {/* Botones de Login/Sign Up o Menú de Usuario a la derecha */}
        <div className="flex items-center">
          {isOnMarketingPage && (
            <div className="flex gap-3 items-center">
              <Link 
                href="/login" 
                className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
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

          {!isOnMarketingPage && user && (
            <div className="flex items-center gap-4">
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                <a onClick={e => e.preventDefault()} className="flex items-center gap-2 cursor-pointer">
                  <Avatar icon={<UserOutlined />} src={user.avatar_url || undefined} size="small" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">
                    {user.name || user.email}
                  </span>
                </a>
              </Dropdown>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
