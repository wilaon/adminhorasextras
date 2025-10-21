// Lógica principal de la aplicación

// Referencias a elementos DOM
const elementos = {
    form: document.getElementById('attendanceForm'),
    fecha: document.getElementById('fecha'),
    dni: document.getElementById('dni'),
    nombre: document.getElementById('nombre'),
    horaEntrada: document.getElementById('horaEntrada'),
    horaSalida: document.getElementById('horaSalida'),
    turno: document.getElementById('turno'),
    turnoIngeniero: document.getElementById('turnoIngeniero'),
    observaciones: document.getElementById('observaciones'),
    submitBtn: document.getElementById('submitBtn'),
    dniValidation: document.getElementById('dniValidation'),
    hoursInfo: document.getElementById('hoursInfo'),
    horasNormales: document.getElementById('horasNormales'),
    horasExtra50: document.getElementById('horasExtra50'),
    horasExtra100: document.getElementById('horasExtra100'),
    totalHoras: document.getElementById('totalHoras'),
    loading: document.getElementById('loading'),
    successMessage: document.getElementById('successMessage'),
    errorMessage: document.getElementById('errorMessage'),
    clock: document.getElementById('clock'),
    veinticincoNocturno: document.getElementById('veinticincoNocturno'),
    veinticinco5am7pm: document.getElementById('veinticinco5am7pm'),
    cincuenta7pm5am: document.getElementById('cincuenta7pm5am'),
    prolongacionNoct75: document.getElementById('prolongacionNoct75'),
    feriadosDomingos100: document.getElementById('feriadosDomingos100'),
};

// Actualizar reloj
function actualizarReloj() {
    elementos.clock.textContent = formatearFechaHora();
}

// Actualizar display de horas
function actualizarCalculoHoras() {
    const calculo = calcularHoras(elementos.horaEntrada.value, elementos.horaSalida.value);
    
    if (calculo) {
        elementos.horasNormales.textContent = calculo.formatoNormales;
        elementos.horasExtra50.textContent = calculo.formatoExtra50;
        elementos.horasExtra100.textContent = calculo.formatoExtra100;
        elementos.totalHoras.textContent = calculo.formatoTotal;
        mostrarElemento(elementos.hoursInfo, true);
    } else {
        mostrarElemento(elementos.hoursInfo, false);
    }
}



// Validar DNI
function validarDNI(dni) {
    if (dni.length === 15) {
        const empleado = buscarEmpleado(dni);
        console.log('empleado encontrado',empleado);
        //busca nombre del empleado en minuscula o MAYUSCULA
        if (empleado && (empleado.nombre ||empleado.NOMBRE)) {
            elementos.nombre.value = empleado.nombre || empleado.NOMBRE || '';
            elementos.nombre.readOnly = true;
            elementos.dniValidation.textContent = 'Empleado encontrado';
            elementos.dniValidation.className = 'validation-message success show';
            elementos.submitBtn.disabled = false;
        } else {
            elementos.nombre.value = '';
            elementos.nombre.readOnly = false;
            elementos.dniValidation.textContent = 'DNI no registrado - SOLICITAR REGISTRO';
            elementos.dniValidation.className = 'validation-message error show';
            elementos.submitBtn.disabled = true;
        }
    } else {
        elementos.dniValidation.classList.remove('show');
        elementos.nombre.value = '';
        elementos.nombre.readOnly = false;
        elementos.submitBtn.disabled = true;
    }
}

// Procesar envío del formulario
async function procesarFormulario(e) {
    e.preventDefault();
    
    // Validar horas
    if (!elementos.horaEntrada.value && !elementos.horaSalida.value) {
        mostrarMensaje(elementos.errorMessage, 'Ingrese al menos hora de entrada o salida');
        return;
    }
    
    // Mostrar loading
    elementos.loading.style.display = 'block';
    elementos.submitBtn.disabled = true;
    
    // Preparar datos
    const datos = {
        fecha: elementos.fecha.value,
        dni: elementos.dni.value,
        nombre: elementos.nombre.value,
        horaEntrada: elementos.horaEntrada.value,
        horaSalida: elementos.horaSalida.value,
        turno: elementos.turno.value,
        turnoIngeniero:elementos.turnoIngeniero.value,
        observaciones: elementos.observaciones.value,
      
    };
    
    // Guardar
    const resultado = await guardarAsistencia(datos);
    
    // Ocultar loading
    elementos.loading.style.display = 'none';
    elementos.submitBtn.disabled = false;
    
    if (resultado.success) {
        mostrarMensaje(elementos.successMessage, 'Asistencia registrada correctamente');
        elementos.form.reset();
        elementos.fecha.value = obtenerFechaActual();
        elementos.dniValidation.classList.remove('show');
        // 3. Habilitar campo nombre
        elementos.nombre.readOnly = false;
        mostrarElemento(elementos.hoursInfo, false);
    } else {
        mostrarMensaje(elementos.errorMessage, 'Error al registrar asistencia');
    }
}

// Event Listeners
function inicializarEventos() {
    // DNI input
    elementos.dni.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^0-9]/g, ''); 
        // Aplicar formato mientras escribe: 0000-0000-00000
        if (value.length > 4 && value.length <= 8) {
            value = value.substring(0, 4) + '-' + value.substring(4);
        } else if (value.length > 8) {
            value = value.substring(0, 4) + '-' + 
                    value.substring(4, 8) + '-' + 
                    value.substring(8, 13);
        }
        
        e.target.value = value;
        
        // Validar solo si tiene 15 caracteres (incluyendo guiones)
        if (value.length === 15) {
            validarDNI(value);
        } else {
            elementos.dniValidation.classList.remove('show');
            elementos.nombre.value = '';
            elementos.nombre.readOnly = false;
            elementos.submitBtn.disabled = true;
        }
    });
    
    // Actualizar cálculo de horas
    elementos.horaEntrada.addEventListener('change', actualizarCalculoHoras);
    elementos.horaSalida.addEventListener('change', actualizarCalculoHoras);
    
    // Submit form
    elementos.form.addEventListener('submit', procesarFormulario);
}

// Inicialización
async function inicializar() {
    // Establecer fecha actual
    elementos.fecha.value = obtenerFechaActual();
    
    // Iniciar reloj
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
    
    // Cargar empleados
    await cargarEmpleados();

    //llenar select Turnos
    const turnos = obtenerTurnos();
    llenarSelect(elementos.turno,turnos)

    //Llenar select IngTurno
    const turnoIngenieross = obtenerIngTurno();
    llenarSelect(elementos.turnoIngeniero,turnoIngenieross);
    
    // Configurar eventos
    inicializarEventos();
    
    console.log('Sistema iniciado');
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializar);