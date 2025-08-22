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

            //console.log('Empleados cargados:',Object.keys(empleadosCache).length);
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

    //console.log('Buscando DNI:', dni); // Para debug
    //console.log('Cache disponible:', Object.keys(empleadosCache)); // Para debug
    return empleadosCache[dni] || null;
}

// Guardar asistencia en Google Sheets
async function guardarAsistencia(datos) {
    try {
        // Calcular horas
        const calculo = calcularHoras(datos.horaEntrada, datos.horaSalida);

        let firmaParaGuardar = '';
        if (datos.firmaColab && datos.firmaColab.length > 0) {
            // Si la firma es muy larga, marcar que existe pero no guardar el contenido completo
            if (datos.firmaColab.length > 5000) {
                console.log('Firma muy grande, guardando indicador');
                firmaParaGuardar = 'FIRMA_REGISTRADA_' + new Date().getTime();
            } else {
                firmaParaGuardar = datos.firmaColab;
            }
        }
        
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
            firmaParaGuardar,
            datos.firmaIng || '',
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