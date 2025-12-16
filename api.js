// API - Comunicación con Google Apps Script

// ═══════════════════════════════════════════════════════════
// SISTEMA DE CACHE CENTRALIZADO
// ═══════════════════════════════════════════════════════════
const CacheManager = {
    caches: {
        empleados: { data: null, timestamp: null, duration: 300000 },  // 5 min
        turnos: { data: null, timestamp: null, duration: 600000 },     // 10 min
        ingenieros: { data: null, timestamp: null, duration: 600000 }  // 10 min
    },
    get(key) {
        const cache = this.caches[key];
        if (!cache || !cache.data || !cache.timestamp) return null;
        
        const ahora = Date.now();
        if ((ahora - cache.timestamp) > cache.duration) {
            this.clear(key);
            return null;
        }
        return cache.data;
    },
    set(key, data) {
        const cache = this.caches[key];
        if (cache) {
            cache.data = data;
            cache.timestamp = Date.now();
        }
    },
    clear(key = null) {
        if (key) {
            const cache = this.caches[key];
            if (cache) {
                cache.data = null;
                cache.timestamp = null;
            }
        } else {
            Object.keys(this.caches).forEach(k => {
                this.caches[k].data = null;
                this.caches[k].timestamp = null;
            });
        }
    }
};

// ═══════════════════════════════════════════════════════════
// HELPER PARA PETICIONES POST
// ═══════════════════════════════════════════════════════════
async function postToServer(action, data = {}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action,
                ...data
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        //Verificación de status HTTP 
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        //Lectura de respuesta (antes no se podía con no-cors)
        const result = await response.json();
        //Verificación de éxito
        if (result.success === false) {
            throw new Error(result.error || 'Error desconocido en el servidor');
        }
        return result;
        
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Operación excedió ${timeout}ms`);
        }
        if (error instanceof TypeError) {
            throw new Error('No se pudo conectar con el servidor');
        }
        
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
function formatearDNI(dni) {
    if (!dni) return '';
    let dniLimpio = dni.toString().replace(/[-\s]/g, '');
    dniLimpio = dniLimpio.padStart(13, '0');
    return dniLimpio.substring(0, 4) + '-' + 
           dniLimpio.substring(4, 8) + '-' + 
           dniLimpio.substring(8, 13);
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
async function cargarEmpleados(forzar = false) {
    const ahora = Date.now();
    
    if (!forzar) {
        const cached = CacheManager.get('empleados');
        if (cached) return cached;
    }
    
    try {
        console.log('Cargando empleados...');
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getEmpleados`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.empleados) {
            CacheManager.set('empleados', data.empleados);
            return data.empleados;
        }
        
        throw new Error('Error al cargar empleados');
        
    } catch (error) {
        console.error('Error:', error);
        const cached = CacheManager.get('empleados');
        if (cached) {
            console.warn('Usando empleados en cache');
            return cached;
        }
        return null;
    }
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
function buscarEmpleado(dni) {
    const empleados = CacheManager.get('empleados');
    if (!empleados) return null;
    return empleados[dni] || null;
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
async function cargarTurnos(forzar = false) {

    if (!forzar) {
        const cached = CacheManager.get('turnos');
        if (cached) return cached;
    }
    try {
        console.log('Cargando turnos desde Sheets...');
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getTurnos`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.turnos)) {
            CacheManager.set('turnos', data.turnos);
            return data.turnos;
        } else {
            console.error('Formato de datos inválido:', data);
            return CacheManager.get('turnos') || [];
        } 
    } catch (error) {
        console.error('Error cargando turnos:', error);
        return CacheManager.get('turnos') || [];
    }
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
async function cargarIngTurno(forzar = false) {

    if (!forzar) {
        const cached = CacheManager.get('ingenieros');
        if (cached) return cached;
    }

    try {
        console.log('Cargando ingenieros desde Sheets...');
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getIngTurno`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }   
        const data = await response.json();
        
        if (data.success && Array.isArray(data.ingenieros)) {
            CacheManager.set('ingenieros', data.ingenieros);
            return data.ingenieros;
        } else {
            console.error('Formato de datos inválido:', data);
            return CacheManager.get('ingenieros') || [];
        }
    } catch (error) {
        console.error('Error cargando ingenieros:', error);
        return CacheManager.get('ingenieros') || [];
    }
}

// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
async function validarLoginServidor(usuario, password) {
    try {
        console.log('Validando login en servidor...');
        
        //  postToServer 
        const result = await postToServer('validarLogin', {
            usuario: usuario,
            password: password
        });
        return result;

    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Error de conexión' 
        };
    }
}

// ═══════════════════════════════════════════════════════════
//  GUARDAR ASISTENCIA (Tu código líneas 163-199)
// ═══════════════════════════════════════════════════════════
async function guardarAsistencia(datos) {
    try {
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
            'Pendiente' 
        ];
        
        console.log('Guardando asistencia...');
        const result = await postToServer('guardarAsistencia', {
            fila: fila
        });
        return { success: true };
        
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR ASISTENCIA
// ═══════════════════════════════════════════════════════════
async function actualizarAsistencia(indiceFila, datos) {
    try {
        console.log('Actualizando asistencia...', { fila: indiceFila });
        
        const result = await postToServer('actualizarAsistencia', {
            indiceFila: indiceFila,
            datos: datos
        });
        
        return result;
        
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// ═══════════════════════════════════════════════════════════
// NUEVA FUNCIÓN - ELIMINAR ASISTENCIA
// ═══════════════════════════════════════════════════════════
async function eliminarAsistencia(indiceFila) {
    try {
        console.log('Eliminando asistencia...', { fila: indiceFila });
    
        const result = await postToServer('eliminarAsistencia', {
            indiceFila: indiceFila
        });
        return result;

    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// ═══════════════════════════════════════════════════════════
// CAMBIAR ESTADO
// ═══════════════════════════════════════════════════════════
async function cambiarEstado(indiceFila, nuevoEstado) {
    try {
        console.log('Cambiando estado...', { 
            fila: indiceFila, 
            estado: nuevoEstado 
        });
        
        const result = await postToServer('cambiarEstado', {
            indiceFila: indiceFila,
            nuevoEstado: nuevoEstado
        });
        
        console.log(`✓ Estado cambiado a: ${nuevoEstado}`);
        return result;
        
    } catch (error) {
        console.error('Error cambiando estado:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}


// ═══════════════════════════════════════════════════════════
// INSERTAR LOTE HORAS 25
// ═══════════════════════════════════════════════════════════
async function insertarLoteHoras25(datosLote) {
    try {
        console.log('Insertando lote en servidor...');
        
        //postToServer AQUI
        const result = await postToServer('insertarLoteHoras25', datosLote);

        console.log('✓ Lote insertado exitosamente');
        return result;
        
    } catch (error) {
        console.error('Error insertando lote:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// ═══════════════════════════════════════════════════════════
// LIMPIAR CACHE
// ═══════════════════════════════════════════════════════════
function limpiarCache() {
    CacheManager.clear();
    console.log('Cache limpiado');
}

// ═══════════════════════════════════════════════════════════
//  OBTENER ESTADO CACHE
// ═══════════════════════════════════════════════════════════
function obtenerEstadoCache() {
    const status = {};
    const ahora = Date.now();
    
    Object.keys(CacheManager.caches).forEach(key => {
        const cache = CacheManager.caches[key];
        const tieneData = !!cache.data;
        const edad = cache.timestamp ? ahora - cache.timestamp : null;
        const esValido = edad !== null && edad < cache.duration;
        
        status[key] = { tieneData, edad, esValido };
    });
    
    return status;
}

