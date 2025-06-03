"use client";

import React, { useState } from 'react';
import { 
  Cog6ToothIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  KeyIcon,
  ChartBarIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Card, Typography } from 'antd';
const { Title, Text: AntText } = Typography;

const settingsPricingPlans = [
  {
    name: 'Professional',
    id: 'professional',
    price: { monthly: 29, yearly: 290 },
    description: 'Para profesionales y equipos pequeños que necesitan más capacidad y control.',
    features: [
      { name: 'Hasta 3 Usuarios', included: true },
      { name: 'Despliegue Universal', included: true },
      { name: 'Soporte por Email', included: true },
    ],
    cta: 'Actualizar a Professional',
  },
  {
    name: 'Team',
    id: 'team',
    price: { monthly: 79, yearly: 790 },
    description: 'Colaboración avanzada y herramientas potentes para equipos en crecimiento.',
    features: [
      { name: 'Hasta 10 Usuarios', included: true },
      { name: 'Despliegue Universal Avanzado', included: true },
      { name: 'Soporte Prioritario', included: true },
    ],
    cta: 'Actualizar a Team',
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: { monthly: null, yearly: null },
    description: 'Soluciones a medida para grandes organizaciones con requisitos complejos.',
    features: [
      { name: 'Usuarios Personalizados', included: true },
      { name: 'Despliegue Universal Completo', included: true },
      { name: 'Soporte Dedicado 24/7', included: true },
    ],
    cta: 'Contactar Ventas',
  },
];

interface SettingsPageProps {
  companyId?: string;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export default function SettingsPage({ companyId }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: 'deployments', label: 'Despliegues', description: 'Notificaciones sobre el estado de los despliegues', email: true, push: true, sms: false },
    { id: 'security', label: 'Seguridad', description: 'Alertas de seguridad y accesos no autorizados', email: true, push: true, sms: true },
    { id: 'billing', label: 'Facturación', description: 'Actualizaciones sobre facturación y pagos', email: true, push: false, sms: false },
    { id: 'maintenance', label: 'Mantenimiento', description: 'Ventanas de mantenimiento programado', email: true, push: true, sms: false }
  ]);

  const sections = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'profile', name: 'Perfil', icon: UserIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
    { id: 'security', name: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'subscription', name: 'Plan y Suscripción', icon: CreditCardIcon },
    { id: 'billing', name: 'Facturación', icon: CreditCardIcon },
    { id: 'api', name: 'API', icon: KeyIcon },
    { id: 'appearance', name: 'Apariencia', icon: PaintBrushIcon }
  ];

  const updateNotification = (id: string, type: 'email' | 'push' | 'sms', value: boolean) => {
    setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, [type]: value } : notif));
  };

  const renderGeneralSettings = () => (
    <Card title={<Title level={4} style={{marginBottom: 0, color: 'inherit' }}>Configuración General</Title>} variant="borderless" className="shadow-sm mb-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Nombre de la Empresa</label>
            <input type="text" defaultValue="Mi Empresa" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Zona Horaria</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200">
              <option>UTC-5 (America/Lima)</option><option>UTC-3 (America/Argentina/Buenos_Aires)</option><option>UTC+0 (Europe/London)</option><option>UTC+1 (Europe/Madrid)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Idioma</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200">
              <option>Español</option><option>English</option><option>Português</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Moneda</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200">
              <option>USD ($)</option><option>EUR (€)</option><option>PEN (S/)</option><option>ARS ($)</option>
            </select>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderProfileSettings = () => (
    <Card title={<Title level={4} style={{marginBottom: 0, color: 'inherit' }}>Información del Perfil</Title>} variant="borderless" className="shadow-sm mb-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Nombre</label>
            <input type="text" defaultValue="Juan Pérez" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Apellido</label>
            <input type="text" defaultValue="González" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200"/>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Email</label>
            <input type="email" defaultValue="juan.perez@empresa.com" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Teléfono</label>
            <input type="tel" defaultValue="+51 999 888 777" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Cargo</label>
            <input type="text" defaultValue="DevOps Engineer" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200"/>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card title={<Title level={4} style={{marginBottom: 0, color: 'inherit' }}>Preferencias de Notificaciones</Title>} variant="borderless" className="shadow-sm mb-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200">
      <div className="space-y-6">
        <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="font-medium text-gray-700 dark:text-slate-300">Tipo</div>
            <div className="font-medium text-gray-700 dark:text-slate-300 text-center"><EnvelopeIcon className="h-5 w-5 mx-auto mb-1" />Email</div>
            <div className="font-medium text-gray-700 dark:text-slate-300 text-center"><BellIcon className="h-5 w-5 mx-auto mb-1" />Push</div>
            <div className="font-medium text-gray-700 dark:text-slate-300 text-center"><DevicePhoneMobileIcon className="h-5 w-5 mx-auto mb-1" />SMS</div>
          </div>
          {notifications.map((notification) => (
            <div key={notification.id} className="grid grid-cols-4 gap-4 py-3 border-t border-gray-200 dark:border-slate-600">
              <div>
                <div className="font-medium text-gray-900 dark:text-slate-200">{notification.label}</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">{notification.description}</div>
              </div>
              <div className="text-center">
                <input type="checkbox" checked={notification.email} onChange={(e) => updateNotification(notification.id, 'email', e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-500 rounded bg-white dark:bg-slate-700"/>
              </div>
              <div className="text-center">
                <input type="checkbox" checked={notification.push} onChange={(e) => updateNotification(notification.id, 'push', e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-500 rounded bg-white dark:bg-slate-700"/>
              </div>
              <div className="text-center">
                <input type="checkbox" checked={notification.sms} onChange={(e) => updateNotification(notification.id, 'sms', e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-500 rounded bg-white dark:bg-slate-700"/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card title={<Title level={4} style={{marginBottom: 0, color: 'inherit' }}>Configuración de Seguridad</Title>} variant="borderless" className="shadow-sm mb-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-slate-200">Autenticación de Dos Factores</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">Agrega una capa extra de seguridad a tu cuenta</p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Habilitado</button>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-slate-200">Sesiones Activas</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">Gestiona tus sesiones activas en diferentes dispositivos</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Ver Sesiones</button>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-slate-200">Cambiar Contraseña</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">Actualiza tu contraseña regularmente</p>
          </div>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Cambiar</button>
        </div>
      </div>
    </Card>
  );

  const renderApiSettings = () => (
    <Card title={<Title level={4} style={{marginBottom: 0, color: 'inherit' }}>Configuración de API</Title>} variant="borderless" className="shadow-sm mb-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200">
      <div className="space-y-4">
        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-slate-200 mb-2">Clave API</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input type={showApiKey ? "text" : "password"} value="sk-1234567890abcdef1234567890abcdef" readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-300"/>
            </div>
            <button onClick={() => setShowApiKey(!showApiKey)} className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
              {showApiKey ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Copiar</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Regenerar</button>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">Usa esta clave para acceder a nuestros APIs. Mantenla segura y no la compartas.</p>
        </div>
        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-slate-200 mb-2">Límites de API</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center"><div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1,000</div><div className="text-sm text-gray-600 dark:text-slate-400">Solicitudes/hora</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-green-600 dark:text-green-400">850</div><div className="text-sm text-gray-600 dark:text-slate-400">Usadas este mes</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-purple-600 dark:text-purple-400">150</div><div className="text-sm text-gray-600 dark:text-slate-400">Restantes</div></div>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderAppearanceSettings = () => (
    <Card title={<Title level={4} style={{marginBottom: 0, color: 'inherit' }}>Configuración de Apariencia</Title>} variant="borderless" className="shadow-sm mb-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Tema</label>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center p-4 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700">
              <input type="radio" name="theme" value="light" defaultChecked className="mr-3 form-radio text-blue-600 dark:bg-slate-700 dark:border-slate-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-slate-200">Claro</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Tema claro estándar</div>
              </div>
            </label>
            <label className="flex items-center p-4 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700">
              <input type="radio" name="theme" value="dark" className="mr-3 form-radio text-blue-600 dark:bg-slate-700 dark:border-slate-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-slate-200">Oscuro</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Tema oscuro para los ojos</div>
              </div>
            </label>
            <label className="flex items-center p-4 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700">
              <input type="radio" name="theme" value="auto" className="mr-3 form-radio text-blue-600 dark:bg-slate-700 dark:border-slate-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-slate-200">Automático</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Sigue el sistema</div>
              </div>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Densidad de la Interface</label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200">
            <option>Compacta</option><option>Normal</option><option>Espaciosa</option>
          </select>
        </div>
      </div>
    </Card>
  );
  
  const renderSubscriptionSettings = () => {
    const currentPlanName = "Starter"; 
    const isYearlyBilling = false; 

    return (
      <Card title={<Title level={4} style={{marginBottom: 0, color: 'inherit' }}>Mi Plan y Suscripción</Title>} variant="borderless" className="shadow-sm mb-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200">
        <div className="space-y-8">
          <div>
            <Title level={5} style={{ color: 'inherit' }} className="mb-1 !text-lg dark:text-slate-100">Mi Plan Actual</Title>
            <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-xl shadow-md">
              <h4 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{currentPlanName}</h4>
              {currentPlanName === "Starter" && (
                <p className="text-md text-blue-600 dark:text-blue-400 mt-2">
                  Disfruta de las funcionalidades esenciales de InfraUX para tus proyectos personales, ¡gratis para siempre!
                </p>
              )}
            </div>
          </div>

          <div>
            <Title level={5} style={{ color: 'inherit' }} className="mb-4 !text-lg dark:text-slate-100">Opciones de Actualización</Title>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {settingsPricingPlans.map((plan) => (
                <div key={plan.id} className="p-6 border border-gray-300 dark:border-slate-700 rounded-xl shadow-lg hover:shadow-electric-purple-500/20 transition-shadow duration-300 flex flex-col justify-between bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <h5 className="font-bold text-xl text-electric-purple-600 dark:text-electric-purple-400">{plan.name}</h5>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 mb-4 min-h-[3em]">{plan.description}</p>
                    <div className="my-4">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-slate-100">
                        {plan.price.monthly === null ? 'Personalizado' : `$${isYearlyBilling && plan.price.yearly ? plan.price.yearly : plan.price.monthly}`}
                      </span>
                      {plan.price.monthly !== null && (
                        <span className="text-base font-medium text-gray-500 dark:text-slate-400">
                          {isYearlyBilling ? '/año' : '/mes'}
                        </span>
                      )}
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1 mb-6 list-disc list-inside pl-2">
                      {(plan.features || []).map((feature: any) => (
                         feature.included && <li key={feature.name}>{feature.name.split('(')[0].trim()}</li>
                      ))}
                       {plan.features.length > 0 && <li className="italic">Y mucho más...</li>}
                    </ul>
                  </div>
                  {plan.id === 'enterprise' ? (
                     <Link href="/contact" legacyBehavior>
                      <a className="block w-full mt-auto text-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold">
                        {plan.cta}
                      </a>
                    </Link>
                  ) : (
                    <Link href={`/pricing#${plan.id}`} legacyBehavior>
                      <a className="block w-full mt-auto text-center px-6 py-3 bg-electric-purple-600 text-white rounded-lg hover:bg-electric-purple-700 transition-colors font-semibold">
                        {plan.cta || `Actualizar a ${plan.name}`}
                      </a>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  };
  
  const renderBillingSettings = () => (
     <Card title={<Title level={4} style={{marginBottom: 0, color: 'inherit' }}>Facturación</Title>} variant="borderless" className="shadow-sm mb-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200">
        <p className="text-gray-600 dark:text-slate-400">Detalles de facturación, historial de pagos y métodos de pago (Próximamente).</p>
     </Card>
  );


  const renderContent = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'profile': return renderProfileSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'billing': return renderBillingSettings();
      case 'subscription': return renderSubscriptionSettings();
      case 'api': return renderApiSettings();
      case 'appearance': return renderAppearanceSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 p-6 h-full"> {/* Cambiado min-h-screen a h-full y ajustado padding si es necesario */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Title level={2} style={{ color: 'inherit' }} className="flex items-center gap-3 !text-3xl !font-bold !text-gray-900 !dark:text-slate-100">
            <Cog6ToothIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Configuración
          </Title>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Gestiona la configuración de tu cuenta y preferencias
          </p>
        </div>

        <div className="lg:flex lg:gap-8">
          <div className="w-full lg:w-64 lg:flex-shrink-0 mb-8 lg:mb-0">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600 dark:border-blue-400 font-semibold'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${activeSection === section.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'}`} />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 space-y-6"> {/* Añadido space-y-6 para espaciado entre cards */}
            {renderContent()}
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-end">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
