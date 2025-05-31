import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChartBarIcon, 
  KeyIcon, 
  RocketLaunchIcon,
  CogIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  ChartBarIcon as ChartBarIconSolid, 
  KeyIcon as KeyIconSolid, 
  RocketLaunchIcon as RocketLaunchIconSolid 
} from '@heroicons/react/24/solid';

interface CompanySidebarProps {
  activeSection?: 'diagrams' | 'credentials' | 'deployments' | 'settings' | 'team';
  onSectionChange?: (section: 'diagrams' | 'credentials' | 'deployments' | 'settings' | 'team') => void;
  companyName?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CompanySidebar: React.FC<CompanySidebarProps> = ({
  activeSection: propActiveSection,
  onSectionChange,
  companyName = 'Company',
  isCollapsed = false,
  onToggleCollapse
}) => {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  // Get current section from sessionStorage or default to diagrams
  const getCurrentSection = (): 'diagrams' | 'credentials' | 'deployments' | 'settings' | 'team' => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`activeSection_${companyId}`);
      if (stored && ['diagrams', 'credentials', 'deployments', 'settings', 'team'].includes(stored)) {
        return stored as 'diagrams' | 'credentials' | 'deployments' | 'settings' | 'team';
      }
    }
    return propActiveSection || 'diagrams';
  };

  const [currentActiveSection, setCurrentActiveSection] = useState<'diagrams' | 'credentials' | 'deployments' | 'settings' | 'team'>('diagrams');

  // Initialize current section on mount
  useEffect(() => {
    const savedSection = getCurrentSection();
    setCurrentActiveSection(savedSection);
    
    // Notify parent about initial value
    if (onSectionChange && savedSection !== propActiveSection) {
      console.log('Notifying parent of saved section:', savedSection);
      onSectionChange(savedSection);
    }
  }, [companyId]);

  // Check for new prop value
  useEffect(() => {
    if (propActiveSection && propActiveSection !== currentActiveSection) {
      setCurrentActiveSection(propActiveSection);
    }
  }, [propActiveSection]);

  const navigation = [
    {
      id: 'diagrams' as const,
      name: 'Diagramas',
      description: 'Gestiona diagramas de infraestructura',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      color: 'blue'
    },
    {
      id: 'credentials' as const,
      name: 'Credenciales',
      description: 'Configurar credenciales de cloud',
      icon: KeyIcon,
      iconSolid: KeyIconSolid,
      color: 'emerald'
    },
    {
      id: 'deployments' as const,
      name: 'Despliegues',
      description: 'Gestionar deployments universales',
      icon: RocketLaunchIcon,
      iconSolid: RocketLaunchIconSolid,
      color: 'violet'
    },
    {
      id: 'settings' as const,
      name: 'Configuración',
      description: 'Configuración de la empresa',
      icon: CogIcon,
      iconSolid: CogIcon,
      color: 'gray'
    },
    {
      id: 'team' as const,
      name: 'Equipo',
      description: 'Gestionar miembros del equipo',
      icon: UsersIcon,
      iconSolid: UsersIcon,
      color: 'orange'
    }
  ];

  const handleSectionClick = (sectionId: typeof navigation[0]['id']) => {
    // Save to sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`activeSection_${companyId}`, sectionId);
    }
    
    // Update local state
    setCurrentActiveSection(sectionId);
    
    // Call the prop callback if provided
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
  };

  return (
    <div className={`bg-white flex flex-col h-full transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-72'}`}>
      {/* Company Header with Toggle */}
      <div className={`border-b border-gray-200 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'flex-col space-y-2' : 'justify-between'}`}>
          {isCollapsed ? (
            <>
              {/* Collapsed Layout - Vertical Stack */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-white" />
              </div>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors w-full flex justify-center"
                  title="Expandir sidebar"
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </>
          ) : (
            <>
              {/* Expanded Layout - Horizontal */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">{companyName}</h1>
                  <p className="text-sm text-gray-500">Empresa</p>
                </div>
              </div>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  title="Contraer sidebar"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 ${isCollapsed ? 'p-1' : 'p-2'}`}>
        {navigation.map((item) => {
          const isActive = currentActiveSection === item.id;
          const Icon = isActive ? item.iconSolid : item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={`
                w-full flex items-center rounded-lg transition-all duration-200
                group hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3 space-x-3'}
                ${isActive 
                  ? `bg-${item.color}-50 border border-${item.color}-200 shadow-sm` 
                  : 'hover:bg-gray-50'
                }
              `}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon 
                className={`
                  w-6 h-6 flex-shrink-0 transition-colors
                  ${isActive 
                    ? `text-${item.color}-600` 
                    : 'text-gray-400 group-hover:text-gray-600'
                  }
                `} 
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className={`
                    text-sm font-medium transition-colors
                    ${isActive 
                      ? `text-${item.color}-900` 
                      : 'text-gray-900 group-hover:text-gray-900'
                    }
                  `}>
                    {item.name}
                  </p>
                  <p className={`
                    text-xs transition-colors
                    ${isActive 
                      ? `text-${item.color}-700` 
                      : 'text-gray-500 group-hover:text-gray-600'
                    }
                  `}>
                    {item.description}
                  </p>
                </div>
              )}
              {isActive && !isCollapsed && (
                <div className={`w-2 h-2 rounded-full bg-${item.color}-600 animate-pulse`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              🚀 Aether Platform
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Infraestructura como código simplificada
            </p>
            <div className="flex space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <span className="text-xs text-gray-500">75%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Plan Pro</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySidebar;
