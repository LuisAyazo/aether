// Servicio para la gestión de compañías

import { getAuthToken } from './authService';
import { Settings } from '../config';
import { Environment } from './diagramService';

// Extendemos la interfaz Company para ser compatible con ambos usos
export interface Company {
  _id: string;
  id?: string; // Para compatibilidad con otras partes del código
  name: string;
  slug: string;
  owner_id: string;
  members: string[];
  created_at: string;
  updated_at: string;
  settings?: Settings; // Añadido settings de tipo Settings
  createdAt?: Date; // Para compatibilidad con config.ts
  updatedAt?: Date; // Para compatibilidad con config.ts
  description?: string; // Para compatibilidad con config.ts
  environments?: Environment[]; // Añadido environments de tipo Environment[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function createCompany(name: string, slug: string): Promise<Company> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No estás autenticado');
  }

  try {
    console.log(`Creando compañía: ${name}, slug: ${slug}`);
    const response = await fetch(`${API_URL}/api/v1/companies`, { // Añadido v1
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name, slug })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear la compañía');
    }

    // Guardar la compañía en localStorage como fallback
    const company = await response.json();
    
    // Asegurar que tenemos un ID consistente (_id y id) para evitar problemas
    if (company._id && !company.id) {
      company.id = company._id;
    } else if (company.id && !company._id) {
      company._id = company.id;
    }
    
    // Verificar que tengamos un ID válido
    if (!company._id && !company.id) {
      console.error('La API devolvió una compañía sin ID válido:', company);
      throw new Error('La API devolvió una respuesta incompleta');
    }
    
    localStorage.setItem('lastCreatedCompany', JSON.stringify(company));
    
    console.log('Compañía creada con éxito:', company);
    return company;
  } catch (error) {
    console.error('Error al crear compañía:', error);
    throw error;
  }
}

export async function getCompanies(): Promise<Company[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No estás autenticado');
  }

  const response = await fetch(`${API_URL}/api/v1/companies`, { // Añadido v1
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al obtener las compañías');
  }

  return response.json();
}

export const getCompany = async (companyId: string): Promise<Company> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No estás autenticado');
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/companies/${companyId}`, { // Añadido v1
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al obtener la compañía');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener compañía:', error);
    throw new Error('No se pudo obtener la información de la compañía. Por favor, vuelve a la página principal.');
  }
};

export async function updateCompany(companyId: string, companyData: Partial<Company>): Promise<Company> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No estás autenticado');
  }

  const response = await fetch(`${API_URL}/api/v1/companies/${companyId}`, { // Añadido v1
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(companyData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al actualizar la compañía');
  }

  return response.json();
}

export async function addMember(companyId: string, userEmail: string): Promise<{ message: string }> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No estás autenticado');
  }

  const response = await fetch(`${API_URL}/api/v1/companies/${companyId}/members/${userEmail}`, { // Añadido v1
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al agregar miembro');
  }

  return response.json();
}
