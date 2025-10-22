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


// Llenar un select con opciones dinámicas
async function llenarSelectTurnos(selectElement) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">Cargando turnos...</option>';
    
    const turnos = await cargarTurnos();
    
    selectElement.innerHTML = '<option value="">Seleccionar turno...</option>';
    turnos.forEach(turno => {
        const option = document.createElement('option');
        option.value = turno.turno;
        option.textContent = turno.turno;
        selectElement.appendChild(option);
    });
}

// Llenar select de ingenieros
async function llenarSelectIngenieros(selectElement) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">Cargando ingenieros...</option>';
    
    const ingenieros = await cargarIngTurno();
    
    selectElement.innerHTML = '<option value="">Seleccionar ingeniero...</option>';
    ingenieros.forEach(ing => {
        const option = document.createElement('option');
        option.value = ing.nombre;
        option.textContent = ing.nombre;
        selectElement.appendChild(option);
    });
}

// Llenar select
function llenarSelect(selectElement, opciones){

     if (!selectElement) return;
    selectElement.innerHTML = '';

    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.value || opcion.turno || option.nombre;
        option.textContent = opcion.texto || opcion.turno || option.nombre;
        selectElement.appendChild(option);
    });
}

