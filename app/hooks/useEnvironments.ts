import { useState, useEffect } from 'react';

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, any>;
  color?: string;
  description?: string;
  companyId?: string;
}

const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: 'dev',
    name: 'Development',
    variables: { 
      env: 'dev', 
      region: 'us-east1', 
      stage: 'development', 
      tier: 'small',
      domain: 'dev.example.com'
    },
    color: 'blue',
    description: 'Development environment for testing new features'
  },
  {
    id: 'staging',
    name: 'Staging',
    variables: { 
      env: 'staging', 
      region: 'us-west1', 
      stage: 'staging', 
      tier: 'medium',
      domain: 'staging.example.com'
    },
    color: 'yellow',
    description: 'Staging environment for pre-production testing'
  },
  {
    id: 'prod',
    name: 'Production',
    variables: { 
      env: 'prod', 
      region: 'us-central1', 
      stage: 'production', 
      tier: 'large',
      domain: 'example.com'
    },
    color: 'red',
    description: 'Production environment for live applications'
  }
];

export const useEnvironments = (companyId?: string) => {
  const [environments, setEnvironments] = useState<Environment[]>(DEFAULT_ENVIRONMENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load environments from API or localStorage
  useEffect(() => {
    const loadEnvironments = async () => {
      if (!companyId) {
        setEnvironments(DEFAULT_ENVIRONMENTS);
        return;
      }

      setLoading(true);
      try {
        // Try to load from localStorage first
        const stored = localStorage.getItem(`environments_${companyId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setEnvironments([...DEFAULT_ENVIRONMENTS, ...parsed]);
        } else {
          // In the future, this would be an API call
          // const response = await fetch(`/api/companies/${companyId}/environments`);
          // const envs = await response.json();
          setEnvironments(DEFAULT_ENVIRONMENTS);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load environments');
        setEnvironments(DEFAULT_ENVIRONMENTS);
      } finally {
        setLoading(false);
      }
    };

    loadEnvironments();
  }, [companyId]);

  const addEnvironment = (env: Omit<Environment, 'id'>) => {
    const newEnv = {
      ...env,
      id: `env_${Date.now()}`,
      companyId
    };
    
    const updatedEnvs = [...environments, newEnv];
    setEnvironments(updatedEnvs);
    
    // Save to localStorage
    if (companyId) {
      const customEnvs = updatedEnvs.filter(e => e.companyId === companyId);
      localStorage.setItem(`environments_${companyId}`, JSON.stringify(customEnvs));
    }
    
    return newEnv;
  };

  const updateEnvironment = (id: string, updates: Partial<Environment>) => {
    const updatedEnvs = environments.map(env => 
      env.id === id ? { ...env, ...updates } : env
    );
    setEnvironments(updatedEnvs);
    
    // Save to localStorage
    if (companyId) {
      const customEnvs = updatedEnvs.filter(e => e.companyId === companyId);
      localStorage.setItem(`environments_${companyId}`, JSON.stringify(customEnvs));
    }
  };

  const deleteEnvironment = (id: string) => {
    // Don't allow deletion of default environments
    if (['dev', 'staging', 'prod'].includes(id)) {
      setError('Cannot delete default environments');
      return;
    }
    
    const updatedEnvs = environments.filter(env => env.id !== id);
    setEnvironments(updatedEnvs);
    
    // Save to localStorage
    if (companyId) {
      const customEnvs = updatedEnvs.filter(e => e.companyId === companyId);
      localStorage.setItem(`environments_${companyId}`, JSON.stringify(customEnvs));
    }
  };

  return {
    environments,
    loading,
    error,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment
  };
};
