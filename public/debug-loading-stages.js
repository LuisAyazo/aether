// Script para debuggear las etapas de carga
console.log('🔍 === DEBUG DE ETAPAS DE CARGA ===');

// Interceptar todas las llamadas HTTP
const originalFetch = window.fetch;
let loadingStages = {
    stage1: { name: 'Cargando datos iniciales', calls: [], startTime: null, endTime: null },
    stage2: { name: 'Cargando diagrama', calls: [], startTime: null, endTime: null }
};

let currentStage = null;

// Detectar cambios en el texto de loading
const detectLoadingStage = () => {
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    loadingElements.forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes('cargando datos')) {
            if (!loadingStages.stage1.startTime) {
                loadingStages.stage1.startTime = Date.now();
                currentStage = 'stage1';
                console.log('📊 Etapa 1 iniciada: Cargando datos');
            }
        } else if (text.includes('cargando diagrama')) {
            if (loadingStages.stage1.startTime && !loadingStages.stage1.endTime) {
                loadingStages.stage1.endTime = Date.now();
            }
            if (!loadingStages.stage2.startTime) {
                loadingStages.stage2.startTime = Date.now();
                currentStage = 'stage2';
                console.log('🎨 Etapa 2 iniciada: Cargando diagrama');
            }
        }
    });
};

// Interceptar fetch
window.fetch = async function(...args) {
    const url = args[0].toString();
    const startTime = Date.now();
    
    try {
        const response = await originalFetch.apply(this, args);
        const duration = Date.now() - startTime;
        
        // Registrar la llamada en la etapa actual
        if (currentStage && loadingStages[currentStage]) {
            loadingStages[currentStage].calls.push({
                url: url,
                duration: duration,
                timestamp: Date.now()
            });
        }
        
        console.log(`📡 [${currentStage || 'sin-etapa'}] ${url} - ${duration}ms`);
        
        return response;
    } catch (error) {
        console.error('Error en fetch:', error);
        throw error;
    }
};

// Observar cambios en el DOM
const observer = new MutationObserver(() => {
    detectLoadingStage();
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
});

// Reporte final después de 10 segundos
setTimeout(() => {
    if (loadingStages.stage2.startTime && !loadingStages.stage2.endTime) {
        loadingStages.stage2.endTime = Date.now();
    }
    
    console.log('\n📊 === REPORTE DE ETAPAS DE CARGA ===\n');
    
    // Etapa 1
    if (loadingStages.stage1.startTime) {
        const duration1 = (loadingStages.stage1.endTime || Date.now()) - loadingStages.stage1.startTime;
        console.log(`🔸 ETAPA 1: ${loadingStages.stage1.name}`);
        console.log(`   ⏱️ Duración: ${duration1}ms`);
        console.log(`   📡 Llamadas HTTP: ${loadingStages.stage1.calls.length}`);
        
        if (loadingStages.stage1.calls.length > 0) {
            console.log('   📋 Detalle de llamadas:');
            loadingStages.stage1.calls.forEach(call => {
                console.log(`      - ${call.url.substring(0, 80)}... (${call.duration}ms)`);
            });
        }
    }
    
    // Etapa 2
    if (loadingStages.stage2.startTime) {
        const duration2 = (loadingStages.stage2.endTime || Date.now()) - loadingStages.stage2.startTime;
        console.log(`\n🔸 ETAPA 2: ${loadingStages.stage2.name}`);
        console.log(`   ⏱️ Duración: ${duration2}ms`);
        console.log(`   📡 Llamadas HTTP: ${loadingStages.stage2.calls.length}`);
        
        if (loadingStages.stage2.calls.length > 0) {
            console.log('   📋 Detalle de llamadas:');
            loadingStages.stage2.calls.forEach(call => {
                console.log(`      - ${call.url.substring(0, 80)}... (${call.duration}ms)`);
            });
        }
    }
    
    // Resumen
    const totalTime = (loadingStages.stage2.endTime || Date.now()) - (loadingStages.stage1.startTime || Date.now());
    const totalCalls = loadingStages.stage1.calls.length + loadingStages.stage2.calls.length;
    
    console.log('\n📊 RESUMEN TOTAL:');
    console.log(`   ⏱️ Tiempo total: ${totalTime}ms`);
    console.log(`   📡 Total de llamadas HTTP: ${totalCalls}`);
    
    // Identificar cuellos de botella
    console.log('\n🚨 CUELLOS DE BOTELLA:');
    const allCalls = [...loadingStages.stage1.calls, ...loadingStages.stage2.calls];
    const slowCalls = allCalls.filter(call => call.duration > 500);
    
    if (slowCalls.length > 0) {
        console.log('   Llamadas lentas (>500ms):');
        slowCalls.sort((a, b) => b.duration - a.duration).forEach(call => {
            console.log(`   ❌ ${call.url.substring(0, 60)}... - ${call.duration}ms`);
        });
    }
    
    console.log('\n💡 RECOMENDACIONES:');
    if (loadingStages.stage1.calls.length > 3) {
        console.log('   - Etapa 1 tiene muchas llamadas. Considera combinarlas en un endpoint.');
    }
    if (duration1 > 2000) {
        console.log('   - Etapa 1 toma más de 2s. Revisar queries de base de datos.');
    }
    if (duration2 > 1000) {
        console.log('   - Etapa 2 (diagrama) toma más de 1s. Optimizar query de diagrama.');
    }
    
}, 10000);

console.log('⏳ Monitoreando etapas de carga... Espera 10 segundos para ver el reporte completo.');
