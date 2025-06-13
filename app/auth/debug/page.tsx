'use client';

import { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase";

export default function AuthDebug() {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    const gatherInfo = async () => {
      const currentUrl = window.location.origin;
      const callbackUrl = `${currentUrl}/auth/callback`;
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Get Supabase config
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const projectRef = supabaseUrl?.split('//')[1].split('.')[0];
      
      setInfo({
        currentUrl,
        callbackUrl,
        supabaseUrl,
        projectRef,
        hasSession: !!session,
        sessionError: error?.message,
        cookies: document.cookie,
        localStorage: {
          hasSupabaseAuth: !!localStorage.getItem(`sb-${projectRef}-auth-token`),
          keys: Object.keys(localStorage).filter(k => k.includes('sb-'))
        }
      });
    };

    gatherInfo();
  }, []);

  const testDirectAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) {
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      alert(`Exception: ${err}`);
    }
  };

  const clearAll = () => {
    // Clear all Supabase related data
    Object.keys(localStorage).forEach(key => {
      if (key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear cookies
    document.cookie.split(";").forEach(c => {
      if (c.includes('sb-')) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      }
    });
    
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Info</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(info, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Copy the callback URL from above: <code className="bg-gray-100 px-2 py-1 rounded">{info.callbackUrl}</code></li>
            <li>Go to <a href="https://app.supabase.com" target="_blank" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
            <li>Navigate to Authentication → URL Configuration</li>
            <li>Add the callback URL to "Redirect URLs"</li>
            <li>Go to Authentication → Providers → Google</li>
            <li>Copy the OAuth callback URL and add it to Google Console</li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testDirectAuth}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Google Auth
            </button>
            
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All Auth Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
