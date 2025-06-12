'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[AUTH CALLBACK] Starting auth callback handler...');
      
      // Log the current URL
      console.log('[AUTH CALLBACK] Current URL:', window.location.href);
      
      try {
        // Check if there's an error in the URL (from OAuth provider)
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
          console.error('[AUTH CALLBACK] OAuth error:', error, errorDescription);
          alert(`Error de autenticación: ${errorDescription || error}`);
          router.push('/login?error=oauth_error');
          return;
        }
        
        // Wait a bit for Supabase to process the callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the session - Supabase should have handled the code exchange automatically
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
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
          
          console.log('[AUTH CALLBACK] User data stored, redirecting to dashboard...');
          
          // Small delay to ensure everything is saved
          setTimeout(() => {
            router.push('/dashboard');
          }, 100);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Autenticando...</p>
      </div>
    </div>
  );
}
