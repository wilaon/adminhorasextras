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

//-------------- Calcular horas trabajadas


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

