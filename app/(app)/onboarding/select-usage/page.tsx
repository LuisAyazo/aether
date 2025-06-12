'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, User as UserIcon } from 'lucide-react'; // Iconos para los botones
import { message } from 'antd'; // Importar message de antd
import { getCurrentUser, getAuthToken, User } from '../../../services/authService'; // Ruta corregida y User importado de aquí

// Necesitaríamos una función para actualizar las settings de uso
// Esto podría estar en authService.ts o un nuevo userService.ts
async function updateUserUsageSettings(usageType: 'personal' | 'company', token: string | null) {
  if (!token) {
    console.error("updateUserUsageSettings: No token provided.");
    throw new Error('No autenticado');
  }
  console.log(`updateUserUsageSettings: Enviando usageType=${usageType} al backend.`);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${API_URL}/api/v1/auth/me/usage-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ usage_type: usageType }), 
  });

  console.log(`updateUserUsageSettings: Respuesta del backend status=${response.status}`);
  const responseData = await response.json(); // Leer JSON independientemente del status para logging

  if (!response.ok) {
    console.error("updateUserUsageSettings: Error del backend:", responseData);
    throw new Error(responseData.detail || 'Error al actualizar las preferencias de uso');
  }
  console.log("updateUserUsageSettings: Datos del usuario actualizados recibidos:", responseData);
  return responseData;
}

async function saveOnboardingTrackingDetails(details: {
  usage_type_selected: string | null;
  how_heard: string | null;
  iac_knowledge: string | null;
  main_interests: string[];
}, token: string | null) {
  if (!token) {
    console.error("saveOnboardingTrackingDetails: No token provided.");
    // Considerar si lanzar un error o simplemente no hacer nada.
    // Si el usuario no está autenticado, no debería poder llegar aquí.
    return;
  }
  console.log("saveOnboardingTrackingDetails: Enviando datos de tracking:", details);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/me/onboarding-extra-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(details),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Error desconocido al guardar datos de tracking." }));
      console.error("saveOnboardingTrackingDetails: Error del backend:", errorData);
      // No lanzar error aquí para no interrumpir el flujo principal si esto es solo para tracking.
      // Se podría mostrar un mensaje no bloqueante.
      message.error(`No se pudieron guardar los detalles adicionales del onboarding: ${errorData.detail}`);
    } else {
      const responseData = await response.json();
      console.log("saveOnboardingTrackingDetails: Datos de tracking guardados exitosamente.", responseData);
    }
  } catch (error) {
    console.error("saveOnboardingTrackingDetails: Excepción al llamar a la API.", error);
    message.error("Error de red al guardar detalles adicionales del onboarding.");
  }
}


export default function SelectUsagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<'personal' | 'company' | 'submit' | null>(null); // 'submit' para el envío final
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUsageType, setSelectedUsageType] = useState<'personal' | 'company' | null>(null);
  const [howHeard, setHowHeard] = useState<string | null>(null);
  const [iacKnowledge, setIacKnowledge] = useState<string | null>(null); // Nuevo estado para IaC
  const [mainInterests, setMainInterests] = useState<string[]>([]);


  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Si ya tiene un usage_type, no debería estar en esta página, redirigir.
      // (Esta lógica también podría estar en un HOC o en el layout de la app)
      if (user.usage_type) {
        router.replace('/dashboard'); // O a la página de compañía si es relevante
      }
    } else {
      // Si no hay usuario, redirigir a login
      router.replace('/login');
    }
  }, [router]);

  const handleSelectUsage = async (usageType: 'personal' | 'company') => {
    setSelectedUsageType(usageType);
    setCurrentStep(2); // Avanzar al paso "¿Cómo escuchaste de nosotros?"
  };

  const handleHowHeardNext = () => {
    if (!howHeard) {
      setError("Por favor, selecciona una opción.");
      return;
    }
    setError(null);
    setCurrentStep(3); // Avanzar al paso de conocimiento de IaC
  };

  const handleIacKnowledgeNext = () => {
    if (!iacKnowledge) {
      setError("Por favor, selecciona tu nivel de conocimiento.");
      return;
    }
    setError(null);
    setCurrentStep(4); // Avanzar a la sección de intereses
  };

  const toggleMainInterest = (interest: string) => {
    setMainInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(item => item !== interest) 
        : [...prev, interest]
    );
  };

  // La función de envío se llamará en el último paso
  const handleSubmitOnboarding = async () => {
    if (!selectedUsageType) {
      setError("Por favor, selecciona un tipo de uso.");
      setCurrentStep(1); // Volver al paso de selección de uso
      return;
    }
    setLoading('submit');
    setError(null);
    const token = getAuthToken();
    console.log("handleSubmitOnboarding: Iniciando envío con usageType=", selectedUsageType);

    try {
      const updatedUser = await updateUserUsageSettings(selectedUsageType, token);
      console.log("handleSubmitOnboarding: Usuario actualizado desde API:", updatedUser);
      
      let newUserData = updatedUser; // Variable para almacenar los datos del usuario actualizados
      
      if (typeof window !== 'undefined' && updatedUser) {
         const existingUser = getCurrentUser();
         if (existingUser) {
            newUserData = { ...existingUser, ...updatedUser };
            console.log("handleSubmitOnboarding: Actualizando localStorage con newUserData:", newUserData);
            localStorage.setItem('user', JSON.stringify(newUserData));
            setCurrentUser(newUserData); 
         } else {
            console.warn("handleSubmitOnboarding: No se encontró existingUser en localStorage para actualizar.");
         }
         
         // Guardar datos adicionales de tracking (no crítico para el flujo principal)
         const trackingDetails = {
           usage_type_selected: selectedUsageType,
           how_heard: howHeard,
           iac_knowledge: iacKnowledge,
           main_interests: mainInterests
         };
         // Llamar sin await para no bloquear la redirección si la API de tracking falla
         saveOnboardingTrackingDetails(trackingDetails, token).catch(e => {
            console.warn("Error en segundo plano al guardar datos de tracking:", e);
            // No es necesario notificar al usuario de este error si es solo para tracking interno.
         });

      } else {
        console.warn("handleSubmitOnboarding: updatedUser no recibido o window no definido. No se guardarán datos de tracking.");
      }

      console.log("handleSubmitOnboarding: Redirigiendo después de la actualización...");
      // Siempre redirigir al dashboard
      // El dashboard se encargará de verificar si el usuario necesita crear una compañía
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error("handleSubmitOnboarding: Error durante el proceso.", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error desconocido.');
      }
    } finally {
      setLoading(null);
      console.log("handleSubmitOnboarding: Proceso finalizado.");
    }
  };

  if (!currentUser || currentUser.usage_type) {
    // Muestra un loader o nada mientras redirige si el usuario no debería estar aquí.
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
    );
  }

  const totalSteps = 4; // Definir el número total de pasos

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 font-sans">
      <div className="w-full max-w-xl text-center"> {/* Aumentado max-w-lg a max-w-xl */}
        {/* Header eliminado */}
        
        {currentStep === 1 && (
          <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-2xl p-6 sm:p-10 animate-fade-in">
            <p className="text-sm font-medium text-emerald-green-600 dark:text-emerald-green-400 mb-2">Paso {currentStep} de {totalSteps}</p>
            {/* <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              ¡Bienvenido a <span className="bg-gradient-to-r from-emerald-green-500 via-emerald-green-600 to-emerald-green-700 bg-clip-text text-transparent">InfraUX</span>!
            </h1> */}
            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2 mt-8">
              Selecciona cómo usarás InfraUX
            </p>
            <p className="text-md text-slate-600 dark:text-slate-400 mb-10">
              Esto nos ayudará a personalizar tu experiencia.
            </p>

            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleSelectUsage('personal')}
                disabled={!!loading}
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-70 group"
              >
                <UserIcon className="w-16 h-16 mb-4 text-electric-purple-500 group-hover:text-electric-purple-600 transition-colors" strokeWidth={1.5} />
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Uso Personal</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ideal para proyectos individuales y aprendizaje.
                </p>
                {loading === 'personal' && <span className="mt-2 text-sm text-electric-purple-600">Procesando...</span>}
              </button>

              <button
                onClick={() => handleSelectUsage('company')}
                disabled={!!loading}
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-70 group"
              >
                <Building className="w-16 h-16 mb-4 text-emerald-green-500 group-hover:text-emerald-green-600 transition-colors" strokeWidth={1.5} />
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Uso de Compañía</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Colabora con tu equipo y gestiona proyectos empresariales.
                </p>
                {loading === 'company' && <span className="mt-2 text-sm text-emerald-green-600">Procesando...</span>}
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-2xl p-6 sm:p-10 mt-8 animate-fade-in">
            <p className="text-sm font-medium text-emerald-green-600 dark:text-emerald-green-400 mb-2">Paso {currentStep} de {totalSteps}</p>
            <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-8">
              ¿Cómo escuchaste de nosotros?
            </h2>
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-4">
              {['Redes Sociales', 'Un Amigo/Colega', 'Búsqueda en Google', 'Publicidad Online', 'Otro'].map((option) => (
                <button
                  key={option}
                  onClick={() => setHowHeard(option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                    ${howHeard === option 
                      ? 'bg-emerald-green-500 border-emerald-green-600 text-white shadow-xl ring-2 ring-emerald-green-500 ring-offset-1 dark:ring-offset-slate-800' 
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-emerald-green-500 dark:hover:border-emerald-green-500 hover:shadow-lg focus:ring-emerald-green-500'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={handleHowHeardNext}
              disabled={!howHeard || !!loading}
              className="mt-8 w-full px-6 py-3 bg-electric-purple-600 hover:bg-electric-purple-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50"
            >
              Siguiente
            </button>
            <button
                onClick={() => setCurrentStep(1)}
                className="mt-4 w-full text-sm text-slate-600 dark:text-slate-400 hover:underline"
            >
                Volver
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-2xl p-6 sm:p-10 mt-8 animate-fade-in">
            <p className="text-sm font-medium text-emerald-green-600 dark:text-emerald-green-400 mb-2">Paso {currentStep} de {totalSteps}</p>
            <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-8">
              Tu Experiencia con IaC
            </h2>
            <p className="text-md text-slate-600 dark:text-slate-400 mb-6">
              ¿Cómo describirías tu conocimiento en Infraestructura como Código (IaC)?
            </p>
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-4">
              {[
                'Principiante (Estoy aprendiendo los conceptos básicos)',
                'Intermedio (He usado algunas herramientas de IaC)',
                'Avanzado (Tengo experiencia sólida y uso IaC regularmente)',
                'Experto (Puedo diseñar e implementar soluciones complejas de IaC)'
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => setIacKnowledge(option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                    ${iacKnowledge === option 
                      ? 'bg-emerald-green-500 border-emerald-green-600 text-white shadow-xl ring-2 ring-emerald-green-500 ring-offset-1 dark:ring-offset-slate-800' 
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-emerald-green-500 dark:hover:border-emerald-green-500 hover:shadow-lg focus:ring-emerald-green-500'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={handleIacKnowledgeNext}
              disabled={!iacKnowledge || !!loading}
              className="mt-8 w-full px-6 py-3 bg-electric-purple-600 hover:bg-electric-purple-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50"
            >
              Siguiente
            </button>
            <button
                onClick={() => setCurrentStep(2)}
                className="mt-4 w-full text-sm text-slate-600 dark:text-slate-400 hover:underline"
            >
                Volver
            </button>
          </div>
        )}

        {currentStep === 4 && ( 
             <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-2xl p-6 sm:p-10 mt-8 animate-fade-in">
                <p className="text-sm font-medium text-emerald-green-600 dark:text-emerald-green-400 mb-2">Paso {currentStep} de {totalSteps}</p>
                <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  ¿Qué te interesa explorar?
                </h2>
                <p className="text-md text-slate-600 dark:text-slate-400 mb-8">
                  Selecciona algunas áreas que te gustaría conocer (opcional).
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    'Automatización de Infraestructura', 
                    'Diseño Visual de Arquitecturas', 
                    'Colaboración en Equipo', 
                    'Gestión de Múltiples Nubes',
                    'Despliegues con un Clic',
                    'Monitoreo y Alertas'
                  ].map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleMainInterest(interest)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ease-in-out text-sm transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                        ${mainInterests.includes(interest)
                          ? 'bg-electric-purple-500 border-electric-purple-600 text-white shadow-xl ring-2 ring-electric-purple-500 ring-offset-1 dark:ring-offset-slate-800' 
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-electric-purple-500 dark:hover:border-electric-purple-500 hover:shadow-lg focus:ring-electric-purple-500'
                        }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>

                <button
                    onClick={handleSubmitOnboarding}
                    disabled={!!loading}
                    className="w-full px-6 py-3 bg-emerald-green-600 hover:bg-emerald-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50"
                >
                    {loading === 'submit' ? 'Procesando...' : 'Finalizar Onboarding e Ir al Dashboard'}
                </button>
                 {error && (
                    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
                        {error}
                    </div>
                )}
                <button
                    onClick={() => setCurrentStep(3)} 
                    className="mt-4 w-full text-sm text-slate-600 dark:text-slate-400 hover:underline"
                >
                    Volver
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
