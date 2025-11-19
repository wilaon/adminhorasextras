// API - Comunicación con Google Apps Script

// Cache de empleados
let empleadosCache = null;
let cacheTimestamp = null;

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
    if (!forzar && empleadosCache && cacheTimestamp && 
        (ahora - cacheTimestamp) < CONFIG.CACHE_DURATION) {
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
        return null;
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
async function cargarTurnos() {
    try {
        console.log('Cargando turnos desde Sheets...');
        
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getTurnos`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.turnos)) {

            return data.turnos;
        } else {
            console.error('❌ Formato de datos inválido:', data);
            return [];
        }
        
    } catch (error) {
        console.error('❌ Error cargando turnos:', error);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// CARGAR INGENIEROS
// ═══════════════════════════════════════════════════════════
async function cargarIngTurno() {
    try {
        console.log('Cargando ingenieros desde Sheets...');
        
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getIngTurno`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.ingenieros)) {

            return data.ingenieros;
        } else {
            console.error('❌ Formato de datos inválido:', data);
            return [];
        }
        
    } catch (error) {
        console.error('❌ Error cargando ingenieros:', error);
        return [];
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
        console.log('Respuesta de validación:', data);
        
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