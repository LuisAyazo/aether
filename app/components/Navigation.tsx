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

  return (
    <nav className="fixed w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 py-3 px-6 border-b border-gray-200 dark:border-gray-700"> {/* Ajustado py a 3 */}
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href={isOnMarketingPage ? "/" : "/dashboard"} className="text-xl font-bold text-electric-purple-600 dark:text-electric-purple-400 flex items-center">
          {/* Aquí podrías añadir un logo SVG si lo tienes */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          InfraUX
        </Link>
        
        {isOnMarketingPage && (
          <div className="hidden md:flex items-center gap-6"> {/* Ajustado gap */}
            <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Features</a>
            <Link href="/docs" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Docs</Link> {/* Cambiado a Link */}
            <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">About</Link> {/* Cambiado a Link */}
            <Link href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Blog</Link> {/* Cambiado a Link */}
          </div>
        )}
        
        {isOnMarketingPage && (
          <div className="flex gap-3 items-center"> {/* Ajustado gap */}
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
            {/* Aquí podrías añadir otros links específicos del dashboard si es necesario */}
            {/* <Link href="/dashboard/notifications" className="text-gray-600 dark:text-gray-300 hover:text-electric-purple-600"><BellIcon className="h-6 w-6" /></Link> */}
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
    </nav>
  );
}
