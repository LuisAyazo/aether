import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; 
import { 
  // ChartBarIcon, // No usado en defaultCompanySections actualizado
  // KeyIcon, // No usado en defaultCompanySections actualizado
  // RocketLaunchIcon, // No usado en defaultCompanySections actualizado
  CogIcon, 
  BuildingOfficeIcon,
  UsersIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  ServerStackIcon, 
  DocumentDuplicateIcon as DocumentDuplicateIconOutline,
  WrenchScrewdriverIcon as WrenchScrewdriverIconOutline, // Usado por DashboardPage
  UserCircleIcon as UserCircleIconOutline,
  PlayCircleIcon as PlayCircleIconOutline
} from '@heroicons/react/24/outline';
import { 
  // ChartBarIcon as ChartBarIconSolid, // No usado
  // KeyIcon as KeyIconSolid, // No usado
  // RocketLaunchIcon as RocketLaunchIconSolid, // No usado
  DocumentDuplicateIcon as DocumentDuplicateIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid, // Usado por DashboardPage
  CogIcon as CogIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  PlayCircleIcon as PlayCircleIconSolid,
  ServerStackIcon as ServerStackIconSolid,
  UsersIcon as UsersIconSolid
} from '@heroicons/react/24/solid';

export interface SidebarSection {
  key: string; 
  name: string;
  description?: string;
  icon: React.ElementType;
  iconSolid?: React.ElementType;
  color?: string; 
}

interface CompanySidebarProps {
  activeSection?: string; 
  onSectionChange?: (section: string) => void; 
  companyName?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  sections?: SidebarSection[]; 
  isPersonalSpace?: boolean; 
}

const defaultCompanySections: SidebarSection[] = [
  {
    key: 'diagrams',
    name: 'Diagramas',
    description: 'Gestiona diagramas de infraestructura',
    icon: DocumentDuplicateIconOutline, // Coincidir con DashboardPage
    iconSolid: DocumentDuplicateIconSolid,
    color: 'blue'
  },
  {
    key: 'credentials',
    name: 'Credenciales',
    description: 'Configurar credenciales de cloud',
    icon: UserCircleIconOutline, // Coincidir con DashboardPage
    iconSolid: UserCircleIconSolid,
    color: 'emerald'
  },
  {
    key: 'environments', 
    name: 'Ambientes',
    description: 'Gestionar ambientes de despliegue',
    icon: ServerStackIcon,
    iconSolid: ServerStackIconSolid,
    color: 'teal'
  },
  {
    key: 'deployments',
    name: 'Despliegues',
    description: 'Gestionar deployments universales',
    icon: PlayCircleIconOutline, // Coincidir con DashboardPage (Heroicon)
    iconSolid: PlayCircleIconSolid,
    color: 'violet'
  },
  {
    key: 'settings',
    name: 'Configuración',
    description: 'Configuración de la empresa',
    icon: CogIcon, // Usar CogIcon directamente
    iconSolid: CogIconSolid,
    color: 'gray'
  },
  {
    key: 'team',
    name: 'Equipo',
    description: 'Gestionar miembros del equipo',
    icon: UsersIcon, 
    iconSolid: UsersIconSolid, // Usar UsersIconSolid
    color: 'orange'
  }
];


const CompanySidebar: React.FC<CompanySidebarProps> = ({
  activeSection: propActiveSection,
  onSectionChange,
  companyName = 'Company',
  isCollapsed: propIsCollapsed = false,
  onToggleCollapse,
  sections: customSections, 
  isPersonalSpace = false   
}) => {
  const params = useParams();
  const companyId = params.companyId as string;

  const [internalIsCollapsed, setInternalIsCollapsed] = useState(propIsCollapsed);

  useEffect(() => {
    if (typeof window !== 'undefined' && companyId) { 
      const savedState = localStorage.getItem(`companySidebarCollapsed_${companyId}`);
      if (savedState !== null) {
        try {
          setInternalIsCollapsed(JSON.parse(savedState));
        } catch (e) {
          console.error("Error parsing companySidebarCollapsed from localStorage", e);
        }
      }
    }
  }, [companyId]); 

  useEffect(() => {
    if (typeof window !== 'undefined' && companyId) {
      localStorage.setItem(`companySidebarCollapsed_${companyId}`, JSON.stringify(internalIsCollapsed));
    }
  }, [internalIsCollapsed, companyId]);

  const handleToggleCollapse = () => {
    const newState = !internalIsCollapsed;
    setInternalIsCollapsed(newState); 
    if (onToggleCollapse) {
      onToggleCollapse(); 
    }
  };

  const navigationItemsToRender = customSections || defaultCompanySections;
  const defaultSectionKey = navigationItemsToRender.length > 0 ? navigationItemsToRender[0].key : 'diagrams';

  const getCurrentSection = (): string => {
    if (typeof window !== 'undefined' && companyId) {
      const stored = sessionStorage.getItem(`activeSection_${companyId}`);
      if (stored && navigationItemsToRender.some(item => item.key === stored)) {
        return stored;
      }
    }
    return propActiveSection || defaultSectionKey;
  };

  const [currentActiveSection, setCurrentActiveSection] = useState<string>(defaultSectionKey);

  useEffect(() => {
    const savedSection = getCurrentSection();
    setCurrentActiveSection(savedSection);
    
    if (onSectionChange && savedSection !== propActiveSection) {
      onSectionChange(savedSection);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, propActiveSection]); 

  useEffect(() => {
    if (propActiveSection && propActiveSection !== currentActiveSection) {
      if (navigationItemsToRender.some(item => item.key === propActiveSection)) {
        setCurrentActiveSection(propActiveSection);
      }
    }
  }, [propActiveSection, currentActiveSection, navigationItemsToRender]);


  const handleSectionClick = (sectionKey: string) => {
    if (typeof window !== 'undefined' && companyId) {
      sessionStorage.setItem(`activeSection_${companyId}`, sectionKey);
    }
    setCurrentActiveSection(sectionKey);
    if (onSectionChange) {
      onSectionChange(sectionKey);
    }
  };

  const companyHeaderTitle = isPersonalSpace ? "Espacio Personal" : companyName;
  const companyHeaderSubtitle = isPersonalSpace ? "Cuenta Personal" : "Empresa";

  return (
    <div className={`bg-white dark:bg-slate-900 flex flex-col h-full transition-all duration-300 border-r border-slate-200 dark:border-slate-700 ${internalIsCollapsed ? 'w-20' : 'w-72'}`}>
      <div className={`border-b border-slate-200 dark:border-slate-700 ${internalIsCollapsed ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center ${internalIsCollapsed ? 'flex-col space-y-2 items-center' : 'justify-between'}`}>
          {internalIsCollapsed ? (
            <>
              <div className={`w-10 h-10 bg-gradient-to-br ${isPersonalSpace ? 'from-emerald-green-500 to-sky-500' : 'from-blue-500 to-purple-600'} rounded-lg flex items-center justify-center shadow-md`}>
                {isPersonalSpace ? <UserCircleIconOutline className="w-6 h-6 text-white" /> : <BuildingOfficeIcon className="w-6 h-6 text-white" />}
              </div>
              <button
                onClick={handleToggleCollapse}
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full flex justify-center"
                title="Expandir sidebar"
              >
                <ChevronRightIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`w-10 h-10 bg-gradient-to-br ${isPersonalSpace ? 'from-emerald-green-500 to-sky-500' : 'from-blue-500 to-purple-600'} rounded-lg flex items-center justify-center shadow-md`}>
                 {isPersonalSpace ? <UserCircleIconOutline className="w-6 h-6 text-white" /> : <BuildingOfficeIcon className="w-6 h-6 text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-md font-semibold text-slate-900 dark:text-white truncate" title={companyHeaderTitle}>{companyHeaderTitle}</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={companyHeaderSubtitle}>{companyHeaderSubtitle}</p>
                </div>
              </div>
              <button
                onClick={handleToggleCollapse}
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Contraer sidebar"
              >
                <ChevronLeftIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </>
          )}
        </div>
      </div>

      <nav className={`flex-1 space-y-1 ${internalIsCollapsed ? 'p-2' : 'p-3'}`}>
        {navigationItemsToRender.map((item) => {
          const isActive = currentActiveSection === item.key;
          const IconToRender = (isActive && item.iconSolid) ? item.iconSolid : item.icon;
          const itemColor = item.color || 'gray'; 
          
          return (
            <button
              key={item.key}
              onClick={() => handleSectionClick(item.key)}
              className={`
                w-full flex items-center rounded-lg transition-all duration-200 group
                focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                ${internalIsCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2.5 space-x-3'}
                ${isActive 
                  ? `bg-${itemColor}-50 dark:bg-${itemColor}-500/20 border border-${itemColor}-200 dark:border-${itemColor}-500/30 shadow-sm text-${itemColor}-700 dark:text-${itemColor}-300` 
                  : `text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 focus:ring-${itemColor}-500`
                }
              `}
              title={internalIsCollapsed ? item.name : undefined}
            >
              <IconToRender 
                className={`
                  w-6 h-6 flex-shrink-0 transition-colors
                  ${isActive 
                    ? `text-${itemColor}-600 dark:text-${itemColor}-400` 
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  }
                `} 
              />
              {!internalIsCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className={`
                    text-sm font-medium transition-colors
                    ${isActive 
                      ? `text-${itemColor}-700 dark:text-${itemColor}-300` 
                      : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                    }
                  `}>
                    {item.name}
                  </p>
                  {item.description && (
                    <p className={`
                      text-xs transition-colors
                      ${isActive 
                        ? `text-${itemColor}-600 dark:text-${itemColor}-400` 
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }
                    `}>
                      {item.description}
                    </p>
                  )}
                </div>
              )}
              {isActive && !internalIsCollapsed && (
                <div className={`w-1.5 h-1.5 rounded-full bg-${itemColor}-500 dark:bg-${itemColor}-400 animate-pulse`} />
              )}
            </button>
          );
        })}
      </nav>

      {!internalIsCollapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1">
              🚀 InfraUX Platform
            </h3>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
              Infraestructura visual simplificada
            </p>
            <div className="flex space-x-2">
              <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-1">
                <div className="bg-blue-500 dark:bg-blue-400 h-1 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400">75%</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Plan Pro</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySidebar;
