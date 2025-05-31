import { Select } from 'antd';
import { FolderOutlined } from '@ant-design/icons';

const { Option } = Select;

interface EnvironmentCategorySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
}

export default function EnvironmentCategorySelect({
  value,
  onChange,
  placeholder = 'Selecciona una categoría',
  className,
  allowCustom = false
}: EnvironmentCategorySelectProps) {
  const categories = [
    { value: 'desarrollo', label: 'Desarrollo', icon: '🛠️' },
    { value: 'pruebas', label: 'Pruebas', icon: '🧪' },
    { value: 'producción', label: 'Producción', icon: '🚀' },
    { value: 'otros', label: 'Otros', icon: '📁' }
  ];

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      style={{ width: '100%' }}
      suffixIcon={<FolderOutlined />}
      mode={allowCustom ? 'tags' : undefined}
      tokenSeparators={allowCustom ? [','] : undefined}
    >
      {categories.map(category => (
        <Option key={category.value} value={category.value}>
          <span style={{ marginRight: 8 }}>{category.icon}</span>
          {category.label}
        </Option>
      ))}
    </Select>
  );
}
