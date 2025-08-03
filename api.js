// API - Comunicación con Google Apps Script

// Cache de empleados
let empleadosCache = null;
let cacheTimestamp = null;

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

            console.log('Empleados cargados:',Object.keys(empleadosCache).length);
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

    console.log('Buscando DNI:', dni); // Para debug
    console.log('Cache disponible:', Object.keys(empleadosCache)); // Para debug
    return empleadosCache[dni] || null;
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
            calculo ? calculo.formatoTotal : '-',
            calculo ? calculo.horasNormales.toFixed(2) : '0',
            calculo ? calculo.horasExtra50.toFixed(2) : '0',
            calculo ? calculo.horasExtra100.toFixed(2) : '0',
            datos.turno,
            datos.observaciones || ''
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
        
        return { success: true };
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error: error.message };
    }
}