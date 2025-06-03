'use client'; // Necesario para hooks como useEffect, useRouter, useState

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navigation from "../components/Navigation";
import { getCurrentUser, isAuthenticated, saveAuthData, getAuthToken } from '../services/authService'; // Añadir saveAuthData, getAuthToken
import { User, AuthResponse } from '../services/authService'; // Importar la interfaz User y AuthResponse

// Función para obtener datos del usuario desde /me
async function fetchCurrentUser(token: string): Promise<User | null> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      // Si /me falla (ej. token inválido justo después de recibirlo), desautenticar.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    const userData: User = await response.json();
    return userData;
  } catch (error) {
    console.error("Error fetching current user from /me:", error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [authProcessed, setAuthProcessed] = useState(false); // Nuevo estado para controlar el procesamiento del token

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const tokenType = params.get('token_type');

    if (token && tokenType) {
      // Asumimos que el token JWT contiene la información del usuario o la obtenemos de /me
      // Por simplicidad, si el token está, lo guardamos y asumimos que /me se llamará después si es necesario
      // o que el token ya tiene la info necesaria para getCurrentUser.
      // Una mejor aproximación sería decodificar el token aquí para obtener el 'user' object
      // o hacer una llamada a /me con el nuevo token para obtener el User object completo.
      
      // Simulamos un objeto user básico si no podemos decodificar o llamar a /me aquí.
      // authService.saveAuthData debería idealmente tomar el objeto user completo.
      // Por ahora, solo guardamos el token. getCurrentUser() podría necesitar ser más inteligente.
      
      // Guardar el token
      localStorage.setItem('token', token);
      // El objeto 'user' debería obtenerse del token (decodificándolo) o llamando a /me.
      // Por ahora, getCurrentUser() leerá el nuevo token y si el user no está en localStorage,
      // podría necesitar una lógica para buscarlo o la app podría funcionar solo con el token
      // hasta que una página específica necesite los detalles del usuario.
      // Para que saveAuthData funcione como está, necesitaríamos el objeto user.
      // Guardar el token primero para que fetchCurrentUser pueda usarlo
      localStorage.setItem('token', token);
      
      // Limpiar la URL inmediatamente
      const newPath = pathname.split('?')[0];
      router.replace(newPath, { scroll: false }); // scroll: false para evitar saltos

      fetchCurrentUser(token).then(userFromApi => {
        if (userFromApi) {
          saveAuthData({ access_token: token, token_type: tokenType as string, user: userFromApi });
        }
        // Si userFromApi es null, el token ya fue borrado por fetchCurrentUser
        setAuthProcessed(true); // Marcar como procesado para el siguiente efecto
      });

    } else {
      // Si no hay token en la URL, proceder con la lógica normal.
      setAuthProcessed(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ejecutar solo una vez al montar para procesar el token de la URL

  useEffect(() => {
    if (!authProcessed) {
      // Aún esperando que el token de la URL (si existe) sea procesado por el primer useEffect
      return; 
    }

    if (!isAuthenticated()) {
      // Si después de procesar (o no encontrar token en URL), no está autenticado, redirigir a login
      if (pathname !== '/login' && pathname !== '/register') { // Evitar bucle si ya está en login/register
        router.replace('/login');
      } else {
        setIsLoading(false); // Ya está en una página pública, no cargar
      }
    } else {
      const user = getCurrentUser(); // Ahora debería tener el usuario actualizado si vino de OAuth
      if (user && user.usage_type === null && 
          pathname !== '/onboarding/select-usage' && 
          !pathname.startsWith('/company/create')) { // Permitir /company/create
        router.replace('/onboarding/select-usage');
      } else {
        setIsLoading(false); 
      }
    }
  }, [router, pathname, authProcessed]);

  // Mostrar loader mientras se procesa el token o se verifica la autenticación
  if (isLoading || !authProcessed) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
        {/* Aquí podrías poner un spinner más elaborado */}
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="pt-14"> {/* Ajustado pt-16 a pt-14 para coincidir con h-14 del Nav */}
        {children}
      </main>
    </>
  );
}
