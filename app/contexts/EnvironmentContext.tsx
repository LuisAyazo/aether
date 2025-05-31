'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Environment {
  id: string;
  name: string;
  variables: Record<string, any>;
  color?: string;
  description?: string;
}

interface EnvironmentContextType {
  environments: Environment[];
  activeEnvironment: Environment | null;
  setActiveEnvironment: (env: Environment) => void;
  addEnvironment: (env: Omit<Environment, 'id'>) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const useEnvironments = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironments must be used within an EnvironmentProvider');
  }
  return context;
};

export const EnvironmentProvider: React.FC<{ children: React.ReactNode; companyId?: string }> = ({ 
  children, 
  companyId 
}) => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null);

  // Load environments for the company
  useEffect(() => {
    const loadEnvironments = async () => {
      try {
        // Try to load from localStorage first (for demo purposes)
        const stored = localStorage.getItem(`environments_${companyId || 'default'}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setEnvironments(parsed);
          if (parsed.length > 0) {
            setActiveEnvironment(parsed[0]);
          }
        } else {
          // In the future, this would be an API call
          // For now, return empty array so it uses defaults
          setEnvironments([]);
        }
      } catch (error) {
        console.error('Error loading environments:', error);
        setEnvironments([]);
      }
    };

    loadEnvironments();
  }, [companyId]);

  const addEnvironment = (env: Omit<Environment, 'id'>) => {
    const newEnv = {
      ...env,
      id: `env_${Date.now()}`
    };
    
    const updatedEnvs = [...environments, newEnv];
    setEnvironments(updatedEnvs);
    
    // Save to localStorage
    localStorage.setItem(`environments_${companyId || 'default'}`, JSON.stringify(updatedEnvs));
    
    if (!activeEnvironment) {
      setActiveEnvironment(newEnv);
    }
  };

  const updateEnvironment = (id: string, updates: Partial<Environment>) => {
    const updatedEnvs = environments.map(env => 
      env.id === id ? { ...env, ...updates } : env
    );
    setEnvironments(updatedEnvs);
    
    // Update active environment if it was the one being updated
    if (activeEnvironment?.id === id) {
      setActiveEnvironment({ ...activeEnvironment, ...updates });
    }
    
    // Save to localStorage
    localStorage.setItem(`environments_${companyId || 'default'}`, JSON.stringify(updatedEnvs));
  };

  const deleteEnvironment = (id: string) => {
    const updatedEnvs = environments.filter(env => env.id !== id);
    setEnvironments(updatedEnvs);
    
    // If we deleted the active environment, switch to the first available
    if (activeEnvironment?.id === id) {
      setActiveEnvironment(updatedEnvs.length > 0 ? updatedEnvs[0] : null);
    }
    
    // Save to localStorage
    localStorage.setItem(`environments_${companyId || 'default'}`, JSON.stringify(updatedEnvs));
  };

  return (
    <EnvironmentContext.Provider value={{
      environments,
      activeEnvironment,
      setActiveEnvironment,
      addEnvironment,
      updateEnvironment,
      deleteEnvironment
    }}>
      {children}
    </EnvironmentContext.Provider>
  );
};
