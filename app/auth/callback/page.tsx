'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "../../lib/supabase";
import { fetchAndUpdateCurrentUser } from "../../services/authService";
import { AuthDebugger, interceptRouter } from "../../lib/auth-debug";

export default function AuthCallback() {
  const router = interceptRouter(useRouter());
  const [loadingMessage, setLoadingMessage] = useState('Procesando autenticación...');
  const [loadingStep, setLoadingStep] = useState(0);

  // Mensajes de carga progresivos
  const loadingMessages = [
    'Procesando autenticación...',
    'Verificando credenciales...',
    'Obteniendo información del usuario...',
    'Preparando tu espacio de trabajo...',
    'Casi listo...'
  ];

  useEffect(() => {
    // Cambiar mensaje cada 2 segundos
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        const next = prev + 1;
        if (next < loadingMessages.length) {
          setLoadingMessage(loadingMessages[next]);
          return next;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleCallback = async () => {
      AuthDebugger.log('AuthCallback', 'start', {
        url: window.location.href,
        hash: window.location.hash,
        search: window.location.search
      });
      
      console.log('[AUTH CALLBACK] Starting auth callback handler...');
      
      // Log the current URL
      console.log('[AUTH CALLBACK] Current URL:', window.location.href);
      
      try {
        // Check URL parameters for email confirmation or errors
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        const type = searchParams.get('type');
        const mode = searchParams.get('mode');
        const code = searchParams.get('code');
        
        // Log all parameters for debugging
        console.log('[AUTH CALLBACK] URL hash params:', Object.fromEntries(urlParams));
        console.log('[AUTH CALLBACK] URL search params:', Object.fromEntries(searchParams));
        console.log('[AUTH CALLBACK] Has code:', !!code);
        
        // Check if this is an email confirmation callback
        // Supabase may use different parameter names
        if (type === 'email' || type === 'signup' || type === 'email_confirmation' ||
            mode === 'email' || mode === 'signup' ||
            (urlParams.has('type') && urlParams.get('type') === 'email')) {
          console.log('[AUTH CALLBACK] Email confirmation detected via type/mode');
          // Redirect to login with confirmation message
          router.push('/login?confirmed=true');
          return;
        }
        
        if (error) {
          console.error('[AUTH CALLBACK] OAuth error:', error, errorDescription);
          alert(`Error de autenticación: ${errorDescription || error}`);
          router.push('/login?error=oauth_error');
          return;
        }
        
        // Get the session - Supabase should have handled the code exchange automatically
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Check if we have a code but no existing session - this is likely an email confirmation
        if (code && !session) {
          console.log('[AUTH CALLBACK] Has code but no session - email confirmation flow');
          
          // Check if there's already a user logged in before the code exchange
          const { data: { user: existingUser } } = await supabase.auth.getUser();
          const hadExistingUser = !!existingUser;
          
          // Try to exchange the code for a session (email confirmation)
          try {
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (!exchangeError && exchangeData?.session) {
              console.log('[AUTH CALLBACK] Code exchanged successfully');
              
              // If there was no existing user before, this is a new email confirmation
              if (!hadExistingUser) {
                console.log('[AUTH CALLBACK] Email confirmation detected - signing out and redirecting to login');
                // Clear the session since this is just email confirmation
                await supabase.auth.signOut();
                router.push('/login?confirmed=true');
                return;
              }
              // Otherwise, continue with normal auth flow
            } else if (exchangeError) {
              console.error('[AUTH CALLBACK] Error exchanging code:', exchangeError);
              // If code exchange fails, redirect to login
              router.push('/login?error=invalid_code');
              return;
            }
          } catch (err) {
            console.error('[AUTH CALLBACK] Error in code exchange:', err);
            router.push('/login?error=exchange_failed');
            return;
          }
        }
        
        // If there's no session and no error, it might be an email confirmation
        if (!session && !sessionError && !error) {
          console.log('[AUTH CALLBACK] No session but no error - likely email confirmation');
          router.push('/login?confirmed=true');
          return;
        }
        
        if (sessionError) {
          console.error('[AUTH CALLBACK] Error getting session:', sessionError);
          
          // Try to refresh the page once in case the session is still being processed
          const hasRetried = sessionStorage.getItem('auth_callback_retry');
          if (!hasRetried) {
            sessionStorage.setItem('auth_callback_retry', 'true');
            window.location.reload();
            return;
          }
          
          sessionStorage.removeItem('auth_callback_retry');
          alert(`Error obteniendo sesión: ${sessionError.message}`);
          router.push('/login?error=session_failed');
          return;
        }

        console.log('[AUTH CALLBACK] Session exists:', !!session);
        console.log('[AUTH CALLBACK] User ID:', session?.user?.id);

        if (session) {
          // Successful authentication
          AuthDebugger.log('AuthCallback', 'session-found', {
            userId: session.user?.id,
            email: session.user?.email
          });
          
          console.log('[AUTH CALLBACK] Auth successful, storing user data...');
          
          // Store user data in localStorage for quick access
          const user = session.user;
          const userData = {
            _id: user.id,
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || '',
            auth_provider: user.app_metadata?.provider || 'email',
            avatar_url: user.user_metadata?.avatar_url
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('token', session.access_token); // Store token for backward compatibility
          
          AuthDebugger.log('AuthCallback', 'user-stored', userData);
          console.log('[AUTH CALLBACK] User data stored, fetching complete profile...');
          
          // Fetch complete user profile with onboarding status
          const completeUser = await fetchAndUpdateCurrentUser();
          
          if (completeUser) {
            AuthDebugger.log('AuthCallback', 'profile-fetched', {
              email: completeUser.email,
              onboarding_completed: completeUser.onboarding_completed,
              usage_type: completeUser.usage_type
            });
            
            console.log('[AUTH CALLBACK] Complete user profile:', {
              email: completeUser.email,
              onboarding_completed: completeUser.onboarding_completed,
              usage_type: completeUser.usage_type
            });
            
            // Check onboarding status
            if (completeUser.onboarding_completed !== true || completeUser.usage_type === null) {
              console.log('[AUTH CALLBACK] User needs onboarding, redirecting to onboarding...');
              AuthDebugger.log('AuthCallback', 'redirect-onboarding', { reason: 'incomplete-onboarding' });
              router.push('/onboarding/select-usage');
            } else {
              console.log('[AUTH CALLBACK] User completed onboarding, redirecting to home...');
              AuthDebugger.log('AuthCallback', 'redirect-home', { reason: 'onboarding-complete' });
              router.push('/'); // Home page will handle the rest
            }
          } else {
            // If we couldn't fetch the profile, redirect to home and let it handle the logic
            console.log('[AUTH CALLBACK] Could not fetch complete profile, redirecting to home...');
            AuthDebugger.log('AuthCallback', 'redirect-home', { reason: 'no-profile' });
            router.push('/');
          }
        } else {
          // No session found
          console.log('[AUTH CALLBACK] No session found, redirecting to login...');
          alert('No se encontró sesión. Por favor intenta de nuevo.');
          router.push('/login?error=no_session');
        }
      } catch (error) {
        console.error('[AUTH CALLBACK] Unexpected error:', error);
        alert(`Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`);
        router.push('/login?error=unexpected');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="mb-8">
          <div className="mx-auto mb-6 text-6xl lg:text-7xl font-bold animate-pulse">
            <span className="text-slate-900 dark:text-slate-100">Infra</span>
            <span className="bg-gradient-to-r from-emerald-green-500 via-emerald-green-600 to-emerald-green-700 bg-clip-text text-transparent">UX</span>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <svg className="animate-spin h-8 w-8 text-emerald-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl text-slate-700 dark:text-slate-300 animate-fade-in">
            {loadingMessage}
          </p>
        </div>
        <div className="mt-8 flex justify-center space-x-2">
          {loadingMessages.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-500 ${
                index <= loadingStep
                  ? 'bg-emerald-green-600 w-8'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
