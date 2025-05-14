import { Node } from 'reactflow';

export const getNodeColorByProvider = (node: Node): string => {
  switch (node.data?.provider) {
    case 'aws': return '#f97316';
    case 'gcp': return '#3b82f6';
    case 'azure': return '#0ea5e9';
    default: return '#94a3b8';
  }
};

// Función para generar slugs a partir de nombres (para URLs amigables)
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Convertir espacios en guiones
    .replace(/--+/g, '-') // Reemplazar múltiples guiones con uno solo
    .trim(); // Eliminar espacios iniciales y finales
};
