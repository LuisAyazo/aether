import React from 'react';
import { Diagram } from '../../services/diagramService';

interface DiagramSelectProps {
  diagrams: Diagram[];
  value?: string;
  onChange: (diagramId: string) => void;
  selectedEnvironment?: string;
}

export default function DiagramSelect({ 
  diagrams, 
  value, 
  onChange,
  selectedEnvironment
}: DiagramSelectProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Diagramas</h4>
      <ul className="mt-2 space-y-2">
        {diagrams.map((diagram) => (
          <li key={diagram.id}>
            <button
              onClick={() => onChange(diagram.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                diagram.id === value
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {diagram.name}
            </button>
          </li>
        ))}
      </ul>
      {diagrams.length === 0 && selectedEnvironment && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No hay diagramas en este ambiente
        </p>
      )}
    </div>
  );
}
