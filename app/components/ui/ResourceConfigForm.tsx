import React from 'react';
import { ResourceConfigFormProps, FieldConfig, ResourceValues } from '@/app/types/resourceConfig';

const ResourceConfigForm: React.FC<ResourceConfigFormProps> = ({
  provider,
  resourceType,
  values,
  onChange,
  fields,
  isLoading = false,
  errors = {}, // Destructurar errors con un valor por defecto
}) => {
  // Use dynamic fields if available, fallback to empty state
  const fieldConfig = fields;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-32">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!fieldConfig) {
    return (
      <div className="p-4 text-gray-500">
        No hay configuración disponible para este tipo de recurso.
      </div>
    );
  }

  const handleChange = (fieldName: string, value: any, parentField?: string) => {
    if (parentField) {
      // Manejar campos anidados
      onChange({
        ...values,
        [parentField]: {
          ...values[parentField],
          [fieldName]: value,
        },
      });
    } else {
      // Manejar campos simples
      onChange({
        ...values,
        [fieldName]: value,
      });
    }
  };

  const renderField = (fieldName: string, config: FieldConfig, parentField?: string) => {
    const value = parentField ? values[parentField]?.[fieldName] : values[fieldName];
    const defaultValue = config.default ?? config.defaultValue;
    const errorKey = parentField ? `${parentField}.${fieldName}` : fieldName;
    const fieldErrors = errors[errorKey];

    switch (config.type) {
      case 'text':
        return (
          <div key={errorKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value ?? defaultValue ?? ''}
              onChange={(e) => handleChange(fieldName, e.target.value, parentField)}
              placeholder={config.placeholder}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors ? 'border-red-500' : 'border-gray-300'}`}
            />
            {(config.help || config.description) && !fieldErrors && (
              <p className="mt-1 text-sm text-gray-500">{config.help || config.description}</p>
            )}
            {fieldErrors && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.join(', ')}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={errorKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value ?? defaultValue ?? ''}
              onChange={(e) => handleChange(fieldName, e.target.value, parentField)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors ? 'border-red-500' : 'border-gray-300'}`}
            >
              {config.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {(config.help || config.description) && !fieldErrors && (
              <p className="mt-1 text-sm text-gray-500">{config.help || config.description}</p>
            )}
            {fieldErrors && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.join(', ')}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={errorKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value ?? defaultValue ?? ''}
              onChange={(e) => handleChange(fieldName, Number(e.target.value), parentField)}
              min={config.min}
              max={config.max}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors ? 'border-red-500' : 'border-gray-300'}`}
            />
            {(config.help || config.description) && !fieldErrors && (
              <p className="mt-1 text-sm text-gray-500">{config.help || config.description}</p>
            )}
            {fieldErrors && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.join(', ')}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={errorKey} className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value ?? defaultValue ?? false}
                onChange={(e) => handleChange(fieldName, e.target.checked, parentField)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {config.label}
                {config.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {(config.help || config.description) && !fieldErrors && (
              <p className="mt-1 text-sm text-gray-500">{config.help || config.description}</p>
            )}
            {fieldErrors && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.join(', ')}</p>
            )}
          </div>
        );

      case 'group':
        return (
          <div key={errorKey} className="mb-4 p-4 border border-gray-200 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {config.fields && (
              Array.isArray(config.fields) 
                ? config.fields.map((subConfig, index) => (
                    <div key={subConfig.key || `group_field_${index}`} className="ml-4">
                      {renderField(subConfig.key || `group_field_${index}`, subConfig, fieldName)}
                    </div>
                  ))
                : Object.entries(config.fields).map(([subFieldName, subConfig]) => (
                    <div key={subFieldName} className="ml-4">
                      {renderField(subFieldName, subConfig, fieldName)}
                    </div>
                  ))
            )}
            {/* No se muestran errores a nivel de grupo directamente aquí, se mostrarían en sus campos hijos */}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      {Array.isArray(fieldConfig) 
        ? fieldConfig.map((config, index) => (
            renderField(config.key || `field_${index}`, config)
          ))
        : Object.entries(fieldConfig).map(([fieldName, config]) => (
            renderField(fieldName, config)
          ))
      }
    </div>
  );
};

export default ResourceConfigForm;
