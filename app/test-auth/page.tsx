'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function TestAuth() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[TEST-AUTH] ${message}`);
  };

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      addLog('Checking current session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`Error getting session: ${error.message}`);
        setError(error.message);
      } else {
        addLog(`Session found: ${!!session}`);
        if (session) {
          addLog(`User ID: ${session.user.id}`);
          addLog(`Email: ${session.user.email}`);
          addLog(`Provider: ${session.user.app_metadata?.provider}`);
        }
        setSession(session);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Unexpected error: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleLogin = async () => {
    try {
      addLog('Starting Google login...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        addLog(`Google login error: ${error.message}`);
        setError(error.message);
      } else {
        addLog('Google login initiated, redirecting...');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Unexpected error: ${errorMsg}`);
      setError(errorMsg);
    }
  };

  const signOut = async () => {
    try {
      addLog('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        addLog(`Sign out error: ${error.message}`);
        setError(error.message);
      } else {
        addLog('Signed out successfully');
        setSession(null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Unexpected error: ${errorMsg}`);
      setError(errorMsg);
    }
  };

  const testBackendConnection = async () => {
    try {
      addLog('Testing backend connection...');
      const token = session?.access_token;
      
      if (!token) {
        addLog('No token available');
        return;
      }

      addLog(`Using token: ${token.substring(0, 20)}...`);
      
      const response = await fetch('http://localhost:8001/api/v1/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      addLog(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Backend error: ${errorText}`);
      } else {
        const data = await response.json();
        addLog(`Companies found: ${data.length}`);
        addLog(`Companies: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Backend test error: ${errorMsg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Supabase Auth</h1>
        
        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            {session && (
              <>
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Provider:</strong> {session.user.app_metadata?.provider}</p>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={checkSession}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Check Session
            </button>
            
            {!session && (
              <button
                onClick={testGoogleLogin}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Login with Google
              </button>
            )}
            
            {session && (
              <>
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Sign Out
                </button>
                
                <button
                  onClick={testBackendConnection}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Test Backend
                </button>
              </>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Logs</h2>
          <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
