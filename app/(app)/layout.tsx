'use client'; // Necesario para hooks como useEffect, useRouter, useState

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navigation from "../components/Navigation"; // Este será nuestro MainHeader modificado
import { isAuthenticated, saveAuthData } from '../services/authService'; // getCurrentUser se usará desde el store
import { User } from '../services/authService';
// import { useEditorStore } from '../components/flow/hooks/useEditorStore'; // Ya no se usa para estos datos
import { useNavigationStore } from '../hooks/useNavigationStore'; // Importar el nuevo store
// import { getCompanies, PERSONAL_SPACE_COMPANY_NAME_PREFIX } from '../services/companyService'; // Se manejará en el store

// Función para obtener datos del usuario desde /me (puede permanecer aquí o moverse al authService)
async function fetchCurrentUserFromApi(token: string): Promise<User | null> { // Renombrada para evitar confusión
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
  // Usar estados y acciones del useNavigationStore
  const fetchInitialUser = useNavigationStore(state => state.fetchInitialUser);
  const dataLoading = useNavigationStore(state => state.dataLoading);
  const user = useNavigationStore(state => state.user); 
  const activeCompany = useNavigationStore(state => state.activeCompany); 
  // setActiveCompanyAndLoadData se llamará desde otro useEffect o componente que determine la compañía activa

  const [authProcessed, setAuthProcessed] = useState(false); 
  const [initialLoadDone, setInitialLoadDone] = useState(false); // Para controlar la carga inicial de datos de compañía/ambientes

  useEffect(() => {
    fetchInitialUser(); // Cargar usuario desde localStorage o API al montar
  }, [fetchInitialUser]);

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
      router.replace(newPath, { scroll: false }); 

      fetchCurrentUserFromApi(token).then(userFromApi => {
        if (userFromApi) {
          saveAuthData({ access_token: token, token_type: tokenType as string, user: userFromApi });
          fetchInitialUser(); // Recargar el usuario en el store después de guardar nuevos datos de auth
        }
        setAuthProcessed(true); 
      });

    } else {
      setAuthProcessed(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ejecutar solo una vez al montar para procesar el token de la URL

  useEffect(() => {
    if (!authProcessed) {
      return; 
    }

    const currentAuthStatus = isAuthenticated();
    const localUser = user; // user del store

    if (pathname === '/create-company' || pathname === '/onboarding/select-usage') {
      // Permitir acceso a estas páginas incluso si la carga de datos principal está pendiente
      // setIsLoading(false); // setDataLoading(false) se manejará en el store
      // La carga de datos de compañía/ambientes se hará después o en la página específica
      setInitialLoadDone(true); // Marcar que la lógica de auth/onboarding de este layout ha terminado
      return;
    }

    if (!currentAuthStatus) {
      if (pathname !== '/login' && pathname !== '/register') {
        router.replace('/login');
      } else {
        // Ya está en una página pública, no se necesita dataLoading del store aquí
        // setIsLoading(false); 
      }
    } else {
      if (localUser && localUser.usage_type === null) { 
        router.replace('/onboarding/select-usage');
      } else if (localUser && !activeCompany && !initialLoadDone) {
        // Aquí es donde se debería iniciar la carga de compañía/ambientes
        // Esta lógica se moverá al store o a un componente wrapper
        // Por ahora, asumimos que el store se encarga o DashboardPage lo hará
        // setDataLoading(true); // El store debería manejar esto
        // console.log("AppLayout: Usuario autenticado, iniciando carga de datos de compañía...");
        // Aquí se llamaría a una acción del store como initializeDashboardData()
        // que internamente haría getCompanies, setActiveCompanyAndLoadData, etc.
        // Por ahora, para no romper, dejamos que DashboardPage maneje su propia carga.
        // Esto se refactorizará cuando movamos los selectores al header.
        setInitialLoadDone(true); // Marcar como hecho para este layout
      } else if (activeCompany && !dataLoading && !initialLoadDone) {
        setInitialLoadDone(true);
      }
    }
  }, [router, pathname, authProcessed, user, activeCompany, dataLoading, initialLoadDone]);

  // El loader principal ahora depende de authProcessed y dataLoading del store (o initialLoadDone)
  if (!authProcessed || (isAuthenticated() && dataLoading && !initialLoadDone && pathname !== '/create-company' && pathname !== '/onboarding/select-usage') ) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
      </div>
    );
  }

  const showNavigation = pathname !== '/onboarding/select-usage' && pathname !== '/create-company';

  return (
    <>
      {/* El Navigation (futuro MainHeader) consumirá datos del store */}
      {showNavigation && <Navigation />} 
      <main className={showNavigation ? "pt-20" : ""}> {/* Ajustado a pt-20 (h-20 del Navigation) */}
        {children}
      </main>
    </>
  );
}
