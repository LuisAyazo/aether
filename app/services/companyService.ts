// Servicio para la gestión de compañías

export const PERSONAL_SPACE_COMPANY_NAME_PREFIX = "Personal Space for "; // Añadido y exportado

import { getAuthToken } from './authService';
import { Settings, API_BASE_URL } from '../config'; // Importar API_BASE_URL
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

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // Usar API_BASE_URL importado

interface CompanyCreationData {
  name: string;
  description?: string;
  logo_url?: string;
}

// Helper function to ensure consistent ID structure
const ensureConsistentId = (company: any): Company => {
  if (company.id && !company._id) {
    company._id = company.id;
  } else if (company._id && !company.id) {
    company.id = company._id; // También asegurar que 'id' exista si '_id' existe
  }
  // Si después de esto _id sigue faltando pero id existe (improbable si la interfaz _id es obligatoria)
  // o si ambos faltan, podría haber un problema más profundo con los datos del backend.
  // Por ahora, la interfaz Company hace _id obligatorio.
  return company as Company;
};

export async function createCompany(companyData: CompanyCreationData): Promise<Company> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No estás autenticado');
  }

  const payload: CompanyCreationData = {
    name: companyData.name,
  };
  if (companyData.description !== undefined) {
    payload.description = companyData.description;
  }
  if (companyData.logo_url !== undefined) {
    payload.logo_url = companyData.logo_url;
  }

  try {
    console.log(`Creando compañía con payload: ${JSON.stringify(payload)}`);
    const response = await fetch(`${API_BASE_URL}/v1/companies`, { // Usar API_BASE_URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
      }
      let errorDetail = 'Error al crear la compañía';
      try {
        const errorData = await response.json();
        console.error("Error data from backend (createCompany):", errorData);
        if (errorData && errorData.detail) {
          if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
            errorDetail = errorData.detail.map((d: any) => `${d.loc ? d.loc.join('.') : 'detail'}: ${d.msg}`).join('; ');
          } else if (typeof errorData.detail === 'string') {
            errorDetail = errorData.detail;
          } else {
            errorDetail = JSON.stringify(errorData.detail);
          }
        } else if (response.statusText) {
          errorDetail = response.statusText;
        }
      } catch (e) {
        errorDetail = response.statusText || 'Error al parsear respuesta de error.';
      }
      throw new Error(errorDetail);
    }

    const company = await response.json();
    const consistentCompany = ensureConsistentId(company);
    
    if (!consistentCompany._id) { // _id es obligatorio según la interfaz
      console.error('La API devolvió una compañía sin _id válido después de la consistencia:', consistentCompany);
      throw new Error('La API devolvió una respuesta incompleta (falta _id)');
    }
    
    localStorage.setItem('lastCreatedCompany', JSON.stringify(consistentCompany));
    
    console.log('Compañía creada con éxito:', consistentCompany);
    return consistentCompany;
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

  const response = await fetch(`${API_BASE_URL}/v1/companies`, { // Usar API_BASE_URL
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?session_expired=true';
      throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Error al obtener las compañías');
  }

  const companiesData = await response.json();
  return companiesData.map((company: any) => ensureConsistentId(company));
}

export const getCompany = async (companyId: string): Promise<Company> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No estás autenticado');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/v1/companies/${companyId}`, { // Usar API_BASE_URL
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Error al obtener la compañía');
    }

    const companyData = await response.json();
    return ensureConsistentId(companyData);
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

  const response = await fetch(`${API_BASE_URL}/v1/companies/${companyId}`, { // Usar API_BASE_URL
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(companyData)
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?session_expired=true';
      throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Error al actualizar la compañía');
  }
  
  const updatedCompanyData = await response.json();
  return ensureConsistentId(updatedCompanyData);
}

export async function addMember(companyId: string, userEmail: string): Promise<{ message: string }> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No estás autenticado');
  }

  const response = await fetch(`${API_BASE_URL}/v1/companies/${companyId}/members/${userEmail}`, { // Usar API_BASE_URL
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?session_expired=true';
      throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Error al agregar miembro');
  }

  return response.json();
}
