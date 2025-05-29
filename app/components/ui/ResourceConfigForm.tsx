import React from 'react';
import { resourceFieldConfigs } from '@/app/config/resourceSchemas';
import { ResourceConfigFormProps, FieldConfig, ResourceValues } from '@/app/types/resourceConfig';

const ResourceConfigForm: React.FC<ResourceConfigFormProps> = ({
  provider,
  resourceType,
  values,
  onChange,
}) => {
  const fieldConfig = resourceFieldConfigs[provider]?.[resourceType];

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
    const defaultValue = config.default;

    switch (config.type) {
      case 'text':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.label}
            </label>
            <input
              type="text"
              value={value ?? defaultValue ?? ''}
              onChange={(e) => handleChange(fieldName, e.target.value, parentField)}
              placeholder={config.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {config.help && (
              <p className="mt-1 text-sm text-gray-500">{config.help}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.label}
            </label>
            <select
              value={value ?? defaultValue ?? ''}
              onChange={(e) => handleChange(fieldName, e.target.value, parentField)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {config.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {config.help && (
              <p className="mt-1 text-sm text-gray-500">{config.help}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.label}
            </label>
            <input
              type="number"
              value={value ?? defaultValue ?? ''}
              onChange={(e) => handleChange(fieldName, Number(e.target.value), parentField)}
              min={config.min}
              max={config.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {config.help && (
              <p className="mt-1 text-sm text-gray-500">{config.help}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={fieldName} className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value ?? defaultValue ?? false}
                onChange={(e) => handleChange(fieldName, e.target.checked, parentField)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {config.label}
              </span>
            </label>
            {config.help && (
              <p className="mt-1 text-sm text-gray-500">{config.help}</p>
            )}
          </div>
        );

      case 'group':
        return (
          <div key={fieldName} className="mb-4 p-4 border border-gray-200 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{config.label}</h3>
            {config.fields && Object.entries(config.fields).map(([subFieldName, subConfig]) => (
              <div key={subFieldName} className="ml-4">
                {renderField(subFieldName, subConfig, fieldName)}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      {Object.entries(fieldConfig).map(([fieldName, config]) => (
        renderField(fieldName, config)
      ))}
    </div>
  );
};

export default ResourceConfigForm; 