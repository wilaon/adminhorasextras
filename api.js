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


async function cargarTurnos() {
    try {
        console.log('Cargando turnos desde Sheets...');
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getTurnos`);
        const data = await response.json();
        
        if (data.success) {
            console.log('Turnos cargados:', data.turnos.length);
            return data.turnos;
        }
        
        throw new Error('Error al cargar turnos');
    } catch (error) {
        console.error('Error cargando turnos:', error);
        // Retornar turnos por defecto si falla
        return [
            { id: '1', turno: '06:00-15:00' },
            { id: '2', turno: '07:00-16:00' },
            { id: '3', turno: '09:00-18:00' }
        ];
    }
}



async function cargarIngTurno() {
    try {
        console.log('Cargando ingenieros desde Sheets...');
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getIngTurno`);
        const data = await response.json();
        
        if (data.success) {
            console.log('Ingenieros cargados:', data.ingenieros.length);
            return data.ingenieros;
        }
        
        throw new Error('Error al cargar ingenieros');
    } catch (error) {
        console.error('Error cargando ingenieros:', error);
        // Retornar ingenieros por defecto si falla
        return [
            { id: '1', nombre: 'Ing. Juan Pérez' },
            { id: '2', nombre: 'Ing. Mario López' },
            { id: '3', nombre: 'Ing. Ana Torres' }
        ];
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
        // Calcular horas
        const calculo = calcularHoras(datos.horaEntrada, datos.horaSalida);
        
        // Preparar fila
        const fila = [
            new Date().toISOString(),
            datos.fecha,
            datos.dni,
            datos.nombre,
            datos.horaEntrada || '-',
            datos.horaSalida || '-',
            calculo ? calculo.totalHoras : '-',
            calculo ? calculo.horasNormales : '0',
            calculo ? calculo.horasExtra50 : '0',
            calculo ? calculo.horasExtra100 : '0',
            datos.turno,
            datos.turnoIngeniero,
            datos.observaciones || '',
            calculo ? calculo.veinticincoNocturno : '0',
            calculo ? calculo.veinticinco5am7pm : '0',
            calculo ? calculo.cincuenta7pm5am : '0',
            calculo ? calculo.prolongacionNoct75 : '0',
            calculo ? calculo.feriadosDomingos100 : '0'
        ];

        console.log('Enviando fila:', fila);
        
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