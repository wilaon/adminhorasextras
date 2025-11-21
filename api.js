// API - Comunicación con Google Apps Script

// Cache de empleados
let empleadosCache = null;
let empleadosCacheTimestamp = null;

let cacheTimestamp = null;

let turnosCache = null;
let turnosCacheTimestamp = null;

let ingenierosCache = null;
let ingenierosCacheTimestamp = null;

const CACHE_DURATION_EMPLEADOS = 300000; 
const CACHE_DURATION_TURNOS = 600000;

function formatearDNI(dni) {
    if (!dni) return '';
    
    // Remover guiones y espacios existentes
    let dniLimpio = dni.toString().replace(/[-\s]/g, '');
    
    // Rellenar con ceros a la izquierda hasta 13 dígitos
    dniLimpio = dniLimpio.padStart(13, '0');
    
    // Aplicar formato
    return dniLimpio.substring(0, 4) + '-' + 
           dniLimpio.substring(4, 8) + '-' + 
           dniLimpio.substring(8, 13);
}

// Cargar empleados desde el servidor
async function cargarEmpleados(forzar = false) {
    const ahora = Date.now();
    
    // Usar cache si es válido
    if (!forzar && empleadosCache && empleadosCacheTimestamp && 
        (ahora - empleadosCacheTimestamp) < CONFIG.CACHE_DURATION_EMPLEADOS) {
        return empleadosCache;
    }
    
    try {
        console.log('Cargando empleados....');
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getEmpleados`);
        const data = await response.json();

        console.log('Respuesta del servidor...')
        
        if (data.success) {
            empleadosCache = data.empleados;
            cacheTimestamp = ahora;

            return empleadosCache;
        }
        
        throw new Error('Error al cargar empleados');
    } catch (error) {
        console.error('Error:', error);
        return empleadosCache || null;
    }
}

// Buscar empleado en cache local
function buscarEmpleado(dni) {
    if (!empleadosCache) return null;
    return empleadosCache[dni] || null;
}


// ═══════════════════════════════════════════════════════════
// CARGAR TURNOS
// ═══════════════════════════════════════════════════════════
async function cargarTurnos(forzar = false) {
    const ahora = Date.now();

    if (!forzar && turnosCache && turnosCacheTimestamp && 
        (ahora - turnosCacheTimestamp) < CACHE_DURATION_TURNOS) {
        return turnosCache;
    }

    try {
        console.log('Cargando turnos desde Sheets...');
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getTurnos`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.turnos)) {
            turnosCache = data.turnos;
            turnosCacheTimestamp = ahora;
            return turnosCache;
        } else {
            console.error('❌ Formato de datos inválido:', data);
            return turnosCache || [];
        } 
    } catch (error) {
        console.error('❌ Error cargando turnos:', error);
        return turnosCache || [];
    }
}

// ═══════════════════════════════════════════════════════════
// CARGAR INGENIEROS
// ═══════════════════════════════════════════════════════════
async function cargarIngTurno(forzar = false) {
     const ahora = Date.now();

    if (!forzar && ingenierosCache && ingenierosCacheTimestamp && 
        (ahora - ingenierosCacheTimestamp) < CACHE_DURATION_TURNOS) {
        return ingenierosCache;
    }

    try {
        console.log('Cargando ingenieros desde Sheets...');
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getIngTurno`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.ingenieros)) {
            ingenierosCache = data.ingenieros;
            ingenierosCacheTimestamp = ahora;
            return ingenierosCache;
        } else {
            console.error('❌ Formato de datos inválido:', data);
            return ingenierosCache || [];
        }
    } catch (error) {
        console.error('❌ Error cargando ingenieros:', error);
        return ingenierosCache || [];
    }
}


async function validarLoginServidor(usuario, password) {
    try {
        console.log('Validando login en servidor...');
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'validarLogin',
                usuario: usuario,
                password: password
            })
        });
        
        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Error validando login:', error);
        return { success: false, error: 'Error de conexión' };
    }
}


// Guardar asistencia en Google Sheets
async function guardarAsistencia(datos) {
    try {
        // Preparar fila
        const fila = [
            new Date().toISOString(),
            datos.fecha,
            datos.dni,
            datos.nombre,
            datos.horaEntrada || '-',
            datos.horaSalida || '-',  
            datos.turno,
            datos.turnoIngeniero,
            datos.observaciones || '',
        ];
        await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'guardarAsistencia',
                fila: fila
            })
        });
        
        console.log('Asistencia guardada exitosamente');
        return { success: true };
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error: error.message };
    }
}


function limpiarCache() {
    empleadosCache = null;
    empleadosCacheTimestamp = null;
    turnosCache = null;
    turnosCacheTimestamp = null;
    ingenierosCache = null;
    ingenierosCacheTimestamp = null;
}