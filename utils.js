// Funciones utilitarias

// Formatear fecha actual
function obtenerFechaActual() {
    return new Date().toISOString().split('T')[0];
}

// Formatear fecha y hora para reloj
function formatearFechaHora() {
    return new Date().toLocaleString('es-HN');
}

// Formatear minutos a texto legible
function formatearTiempo(minutos) {
    const h = Math.floor(minutos / 60);
    const m = Math.round(minutos % 60);
    return `${h}h ${m}m`;
}

// Calcular horas trabajadas
function calcularHoras(entrada, salida) {
    if (!entrada || !salida) return null;
    
    const [entradaH, entradaM] = entrada.split(':').map(Number);
    const [salidaH, salidaM] = salida.split(':').map(Number);
    
    let entradaMinutos = entradaH * 60 + entradaM;
    let salidaMinutos = salidaH * 60 + salidaM;
    
    // Si salida es menor, asumir día siguiente
    if (salidaMinutos <= entradaMinutos) {
        salidaMinutos += 24 * 60;
    }
    
    const totalMinutos = salidaMinutos - entradaMinutos;
    const totalHoras = totalMinutos / 60;
    
    // Distribución de horas
    let horasNormales = 0;
    let horasExtra50 = 0;
    let horasExtra100 = 0;
    
    if (totalHoras <= CONFIG.HORAS_NORMALES_DIA) {
        horasNormales = totalHoras;
    } else if (totalHoras <= CONFIG.HORAS_EXTRA_50_LIMITE) {
        horasNormales = CONFIG.HORAS_NORMALES_DIA;
        horasExtra50 = totalHoras - CONFIG.HORAS_NORMALES_DIA;
    } else {
        horasNormales = CONFIG.HORAS_NORMALES_DIA;
        horasExtra50 = CONFIG.HORAS_EXTRA_50_LIMITE - CONFIG.HORAS_NORMALES_DIA;
        horasExtra100 = totalHoras - CONFIG.HORAS_EXTRA_50_LIMITE;
    }
    
    return {
        totalMinutos,
        totalHoras,
        horasNormales,
        horasExtra50,
        horasExtra100,
        formatoTotal: formatearTiempo(totalMinutos),
        formatoNormales: formatearTiempo(horasNormales * 60),
        formatoExtra50: formatearTiempo(horasExtra50 * 60),
        formatoExtra100: formatearTiempo(horasExtra100 * 60)
    };
}

// Mostrar/ocultar elemento
function mostrarElemento(elemento, mostrar = true) {
    if (mostrar) {
        elemento.classList.add('show');
    } else {
        elemento.classList.remove('show');
    }
}

// Mostrar mensaje temporal
function mostrarMensaje(elemento, texto, duracion = 5000) {
    elemento.textContent = texto;
    mostrarElemento(elemento, true);
    
    setTimeout(() => {
        mostrarElemento(elemento, false);
    }, duracion);
}


// Turnos
function obtenerTurnos(){
    return [
        { value: '', texto: 'Seleccionar turno...' },
        { value: '06:00-15:00', texto: '06:00 - 15:00' },
        { value: '07:00-16:00', texto: '07:00 - 16:00' },
        { value: '09:00-18:00', texto: '09:00 - 18:00' },
        { value: '13:00-20:00', texto: '13:00 - 20:00' },
        { value: '14:00-21:00', texto: '14:00 - 21:00' },
        { value: '17:00-23:00', texto: '17:00 - 23:00' },
        { value: '18:00-00:00', texto: '18:00 - 00:00' },
        { value: '00:00-06:00', texto: '00:00 - 06:00' },
        { value: 'descanso1', texto: '1er Día Descanso' },
        { value: 'descanso2', texto: '2do Día Descanso' },
        { value: 'feriado', texto: 'Feriado' }
    ];
}


// Llenar select
function llenarSelect(selectElement, opciones){

    selectElement.innerHTNL = '';

    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.value;
        option.textContent = opcion.texto;
        selectElement.appendChild(option);
    });
}