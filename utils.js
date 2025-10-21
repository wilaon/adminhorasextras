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
    
    const parseHora = h => {
        const [HH, MM] = h.split(':').map(Number);
        return (isNaN(HH) || isNaN(MM)) ? null : HH * 60 + MM;
    };

    let entradaMin = parseHora(entrada);
    let salidaMin  = parseHora(salida);
    if (entradaMin === null || salidaMin === null) return null;

    // Si la salida es menor o igual que la entrada → asumimos que es al día siguiente
    if (salidaMin <= entradaMin) salidaMin += 24 * 60;
    
    const totalMin = salidaMin - entradaMin;
    const totalHoras = totalMin / 60;

    const HORAS_NORMALES = CONFIG.HORAS_NORMALES_DIA;
    const HORAS_EXTRA_50 = CONFIG.HORAS_EXTRA_50_LIMITE;

    // Distribución con fórmulas directas
    let horasNormales = Math.min(totalHoras, HORAS_NORMALES);
    let horasExtra50  = Math.max(0, Math.min(totalHoras, HORAS_EXTRA_50) - HORAS_NORMALES);
    let horasExtra100 = Math.max(0, totalHoras - HORAS_EXTRA_50);
    let veinticincoNocturno = 0;
    let veinticinco5am7pm = 0;
    let cincuenta7pm5am = 0;
    let prolongacionNoct75 = 0;
    let feriadosDomingos100 = 0;

    return {
        totalHoras: totalHoras.toFixed(2),
        horasNormales: horasNormales.toFixed(2),
        horasExtra50: horasExtra50.toFixed(2),
        horasExtra100: horasExtra100.toFixed(2),
        veinticincoNocturno : veinticincoNocturno.toFixed(2),
        veinticinco5am7pm : veinticinco5am7pm.toFixed(2),
        cincuenta7pm5am : cincuenta7pm5am.toFixed(2),
        prolongacionNoct75 : prolongacionNoct75.toFixed(2),
        feriadosDomingos100 : feriadosDomingos100.toFixed(2),
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

     if (!selectElement) return;
    selectElement.innerHTML = '';

    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.value;
        option.textContent = opcion.texto;
        selectElement.appendChild(option);
    });
}


function obtenerIngTurno(){
    return [
        { value: '', texto: 'Seleccionar Ingeniero...' },
        { value: 'juanperez', texto: 'Ing. Juan Pérez' },
        { value: 'mariolopez', texto: 'Ing. Mario López' },
        { value: 'anatorres', texto: 'Ing. Ana Torres' }
    ];
}

