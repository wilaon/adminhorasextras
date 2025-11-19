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


// ═══════════════════════════════════════════════════════════
// LLENAR SELECT DE TURNOS
// ═══════════════════════════════════════════════════════════
async function llenarSelectTurnos(selectElement) {
    if (!selectElement) {
        return;
    }
    
    try {
        selectElement.innerHTML = '<option value="">Cargando turnos...</option>';
        selectElement.disabled = true;
        
        const turnos = await cargarTurnos();
        
        if (!turnos || !Array.isArray(turnos) || turnos.length === 0) {
            selectElement.innerHTML = '<option value="">No hay turnos disponibles</option>';
            return;
        }
        
        selectElement.innerHTML = '<option value="">Seleccionar turno...</option>';
        
        turnos.forEach(turno => {
            const option = document.createElement('option');
            option.value = turno.turno || turno;
            option.textContent = turno.turno || turno;
            selectElement.appendChild(option);
        });
        
        selectElement.disabled = false;
       
        
    } catch (error) {
        selectElement.innerHTML = '<option value="">Error al cargar</option>';
    }
}

// ═══════════════════════════════════════════════════════════
// LLENAR SELECT DE INGENIEROS
// ═══════════════════════════════════════════════════════════
async function llenarSelectIngenieros(selectElement) {
    if (!selectElement) {
        return;
    }
    
    try {
        selectElement.innerHTML = '<option value="">Cargando ingenieros...</option>';
        selectElement.disabled = true;
        
        const ingenieros = await cargarIngTurno();
        
        if (!ingenieros || !Array.isArray(ingenieros) || ingenieros.length === 0) {
            selectElement.innerHTML = '<option value="">No hay ingenieros disponibles</option>';
            return;
        }
        
        selectElement.innerHTML = '<option value="">Seleccionar ingeniero...</option>';
        
        ingenieros.forEach(ing => {
            const option = document.createElement('option');
            option.value = ing.nombre || ing;
            option.textContent = ing.nombre || ing;
            selectElement.appendChild(option);
        });
        
        selectElement.disabled = false;
       
        
    } catch (error) {
        selectElement.innerHTML = '<option value="">Error al cargar</option>';
    }
}

// ═══════════════════════════════════════════════════════════
// LLENAR SELECT GENÉRICO
// ═══════════════════════════════════════════════════════════
function llenarSelect(selectElement, opciones) {
    if (!selectElement) {
        return;
    }
    
    if (!opciones || !Array.isArray(opciones)) {
        return;
    }
    
    selectElement.innerHTML = '';
    
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.value || opcion.turno || opcion.nombre || opcion;
        option.textContent = opcion.texto || opcion.turno || opcion.nombre || opcion;
        selectElement.appendChild(option);
    });
}
