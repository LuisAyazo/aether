# 🔧 Manual de Debug y Solución de Problemas - InfraUX

## 📋 Índice
1. [Scripts de Debug Disponibles](#scripts-de-debug-disponibles)
2. [Problemas Comunes y Soluciones](#problemas-comunes-y-soluciones)
3. [Guía Paso a Paso](#guía-paso-a-paso)
4. [Referencia Rápida de Comandos](#referencia-rápida-de-comandos)

---

## 🛠️ Scripts de Debug Disponibles

### 1. **debug-group-nodes.js**
Analiza el comportamiento de los nodos grupo, dimensiones y elementos invisibles.

### 2. **debug-edges-handles.js**
Diagnostica problemas con conexiones (edges) y puntos de conexión (handles).

---

## 🚨 Problemas Comunes y Soluciones

### 1. **Problema: Los edges pierden su configuración al recargar**
**Síntomas:**
- Los edges pierden su color
- Las líneas sólidas se vuelven punteadas
- Las flechas desaparecen
- Los edges salen del mismo punto en lugar de los handles específicos

**Diagnóstico:**
```javascript
// 1. Cargar script de debug
const script = document.createElement('script');
script.src = '/debug-edges-handles.js';
document.head.appendChild(script);

// 2. Analizar conexiones
debugEdgesHandles.analyze()

// 3. Verificar guardado
debugEdgesHandles.testSaveLoad()
```

**Qué buscar:**
- `sourceHandle: "NO DEFINIDO"` o `targetHandle: "NO DEFINIDO"`
- Valores de `edgeKind` en data
- Si los handles tienen IDs consistentes

**Soluciones:**
1. Verificar que el backend está guardando `sourceHandle` y `targetHandle`
2. Confirmar que `data.edgeKind` se preserva
3. Asegurar que los handles tienen IDs únicos

---

### 2. **Problema: Nodos grupo con dimensiones incorrectas al minimizar**
**Síntomas:**
- Al minimizar, el nodo mantiene una "silueta" transparente
- Las dimensiones no cambian a 280x48px
- Interfiere con otros nodos al hacer clic

**Diagnóstico:**
```javascript
// 1. Cargar script
const script = document.createElement('script');
script.src = '/debug-group-nodes.js';
document.head.appendChild(script);

// 2. Analizar nodos grupo
debugGroupNodes.analyze()

// 3. Visualizar límites
debugGroupNodes.highlightBounds(true)
```

**Qué buscar:**
```
❌ Nodo group-xxx: Dimensiones incorrectas al minimizar
  Esperado: 280x48
  Actual: 320x240
```

**Soluciones:**
```javascript
// Corrección manual temporal
debugGroupNodes.fixMinimizedDimensions()

// Para una solución permanente, verificar:
// 1. Que ReactFlow respete las dimensiones inline
// 2. Que se llame updateNodeInternals() después de cambiar dimensiones
```

---

### 3. **Problema: Handles invisibles pero interactivos**
**Síntomas:**
- Áreas invisibles que capturan clics
- Dificultad para seleccionar nodos cercanos
- Conexiones accidentales

**Diagnóstico:**
```javascript
// Usando debug-group-nodes.js
debugGroupNodes.analyze()
// Buscar: "elementos invisibles pero interactivos encontrados"

// Usando debug-edges-handles.js
debugEdgesHandles.analyze()
// Revisar la sección "HANDLES en el DOM"
```

**Soluciones:**
1. Asegurar que `pointerEvents: 'none'` cuando `opacity: 0`
2. Cambiar dinámicamente pointer-events basado en hover/conexión

---

### 4. **Problema: Redimensionamiento de nodos no funciona correctamente**
**Síntomas:**
- Al redimensionar, el nodo vuelve a su tamaño original
- No se puede cambiar el ancho/alto
- Comportamiento errático al arrastrar handles de resize

**Diagnóstico:**
```javascript
// Monitorear cambios en tiempo real
debugGroupNodes.startMonitoring()
// Luego intentar redimensionar y ver los logs
```

**Soluciones:**
1. Implementar tanto `onResize` como `onResizeEnd`
2. Actualizar dimensiones en el style además de width/height
3. Sincronizar con ReactFlow usando `updateNodeInternals`

---

## 📚 Guía Paso a Paso

### Para diagnosticar problemas con edges:

1. **Cargar el script de debug**
```javascript
const script = document.createElement('script');
script.src = '/debug-edges-handles.js';
script.onload = () => console.log('✅ Script cargado');
document.head.appendChild(script);
```

2. **Ejecutar análisis inicial**
```javascript
debugEdgesHandles.analyze()
```

3. **Activar monitoreo de eventos**
```javascript
debugEdgesHandles.monitor()
```

4. **Crear una conexión de prueba**
- Hacer clic en un handle source
- Arrastrar hasta un handle target
- Observar los logs en consola

5. **Verificar datos de guardado**
```javascript
debugEdgesHandles.testSaveLoad()
```

6. **Crear conexión manual (para pruebas)**
```javascript
// Obtener IDs de nodos primero
debugGroupNodes.getGroupNodes().map(n => n.getAttribute('data-id'))

// Crear conexión con handles específicos
debugEdgesHandles.createTestConnection(
  'node-id-1',     // source node
  'node-id-2',     // target node  
  'right-source',  // source handle
  'left-target'    // target handle
)
```

### Para diagnosticar problemas con nodos grupo:

1. **Cargar el script**
```javascript
const script = document.createElement('script');
script.src = '/debug-group-nodes.js';
script.onload = () => console.log('✅ Script cargado');
document.head.appendChild(script);
```

2. **Análisis completo**
```javascript
debugGroupNodes.analyze()
```

3. **Visualizar problemas**
```javascript
// Mostrar límites de todos los nodos
debugGroupNodes.highlightBounds(true)

// Ocultar límites
debugGroupNodes.highlightBounds(false)
```

4. **Monitoreo en tiempo real**
```javascript
// Iniciar monitoreo
debugGroupNodes.startMonitoring()

// Detener monitoreo
debugGroupNodes.stopMonitoring()
```

5. **Analizar un nodo específico**
```javascript
debugGroupNodes.analyzeNode('group-1234567890')
```

6. **Correcciones manuales**
```javascript
// Forzar dimensiones correctas en nodos minimizados
debugGroupNodes.fixMinimizedDimensions()
```

---

## 🔍 Referencia Rápida de Comandos

### debug-group-nodes.js
```javascript
debugGroupNodes.analyze()                    // Análisis completo
debugGroupNodes.startMonitoring()           // Monitoreo en tiempo real
debugGroupNodes.stopMonitoring()            // Detener monitoreo
debugGroupNodes.analyzeNode(nodeId)         // Analizar nodo específico
debugGroupNodes.fixMinimizedDimensions()    // Corregir dimensiones
debugGroupNodes.highlightBounds(true/false) // Mostrar/ocultar límites
debugGroupNodes.getGroupNodes()             // Obtener todos los nodos grupo
```

### debug-edges-handles.js
```javascript
debugEdgesHandles.analyze()                                              // Análisis completo
debugEdgesHandles.connections()                                          // Solo conexiones
debugEdgesHandles.monitor()                                              // Monitorear eventos
debugEdgesHandles.testSaveLoad()                                        // Test guardar/cargar
debugEdgesHandles.createTestConnection(sourceId, targetId, sourceHandle, targetHandle)
```

---

## 🎯 Checklist de Verificación

### Al reportar un problema:
- [ ] Captura de pantalla del problema
- [ ] Logs de la consola después de ejecutar `analyze()`
- [ ] Versión del navegador
- [ ] Pasos para reproducir el problema
- [ ] Resultado de `testSaveLoad()` si es problema de persistencia

### Antes de considerar solucionado:
- [ ] El problema no se reproduce después de recargar
- [ ] Funciona en modo incógnito
- [ ] No hay errores en la consola
- [ ] Los datos se guardan correctamente en el backend
- [ ] La funcionalidad es consistente

---

## 💡 Tips Adicionales

1. **Siempre recargar la página** (F5) antes de ejecutar scripts de debug
2. **Limpiar la consola** antes de cada prueba para ver solo logs relevantes
3. **Usar modo incógnito** para descartar problemas de caché
4. **Verificar la red** (F12 > Network) para ver qué se envía/recibe del backend
5. **Guardar los logs** importantes antes de recargar la página

---

## 🚀 Workflow de Debug Recomendado

1. **Identificar el problema** visualmente
2. **Cargar el script de debug** apropiado
3. **Ejecutar análisis** inicial
4. **Reproducir el problema** con monitoreo activo
5. **Capturar logs** y resultados
6. **Aplicar correcciones** según este manual
7. **Verificar** que el problema está resuelto
8. **Documentar** la solución si es nueva

---

## 📞 Soporte

Si encuentras un problema no documentado:
1. Ejecuta ambos scripts de debug
2. Captura todos los logs
3. Documenta los pasos exactos para reproducir
4. Comparte la información completa con el equipo de desarrollo

---

*Última actualización: Noviembre 2024*
