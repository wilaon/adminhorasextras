// admin-simple.js - Todo en un archivo para evitar conflictos

// Variables globales
let todosLosRegistros = [];
let registrosFiltrados = [];
let paginaActual = 1;
let registrosPorPagina = 10;

// Función principal - Se ejecuta cuando carga la página
window.onload = function() {
    console.log('Página cargada, iniciando...');
    
    // Establecer fechas por defecto
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    document.getElementById('fechaDesde').value = hace30Dias.toISOString().split('T')[0];
    document.getElementById('fechaHasta').value = hoy.toISOString().split('T')[0];
    
    // Cargar datos
    cargarDatos();
};

// Función para cargar datos desde Google Sheets
async function cargarDatos() {
    console.log('Cargando datos...');
    
    try {
        // Mostrar loading
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        // URL de tu Google Apps Script
        const url = 'https://script.google.com/macros/s/AKfycbw3NROXGOTuY6scy9UT6G8YgQ0rkEdY6brIzj4YLg34syqZhlYdTpWPd1v4Ga5X27aEIQ/exec?action=obtenerAsistencias';
        
        console.log('Llamando a:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Datos recibidos:', data);
        
        if (data.success && data.registros) {
            todosLosRegistros = data.registros;
            registrosFiltrados = [...todosLosRegistros];
            
            console.log(`Se cargaron ${todosLosRegistros.length} registros`);
            
            // Mostrar en tabla
            mostrarDatos();
        } else {
            alert('No se pudieron cargar los datos');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    } finally {
        // Ocultar loading
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Función para mostrar datos en la tabla
function mostrarDatos() {
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    
    // Calcular qué registros mostrar según la página
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const registrosPagina = registrosFiltrados.slice(inicio, fin);
    
    if (registrosPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No hay registros</td></tr>';
        return;
    }
    
    // Crear filas
    registrosPagina.forEach((registro, index) => {
        const indiceReal = inicio + index;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${registro.fecha || '-'}</td>
            <td>${registro.dni || '-'}</td>
            <td>${registro.nombre || '-'}</td>
             <td>${registro.turno || '-'}</td>
            <td>${registro.horaEntrada || '-'}</td>
            <td>${registro.horaSalida || '-'}</td>
            <td>${registro.totalHoras || '-'}</td>
            <td>${registro.turnoIngeniero || '-'}</td>
            <td>${registro.observaciones || '-'}</td>
            <td>${registro.veinticincoNocturno || '-'}</td>
            <td>${registro.veinticinco5am7pm || '-'}</td>
            <td>${registro.cincuenta7pm5am || '-'}</td>
            <td>${registro.prolongacionNoct75 || '-'}</td>
            <td>${registro.feriadosDomingos100 || '-'}</td>
            <td>
                <button class="btn btn-edit" onclick="editarRegistro(${indiceReal})">Edit</button>
                <button class="btn btn-delete" onclick="eliminarRegistro(${indiceReal})">Del</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Actualizar info de paginación
    document.getElementById('showingFrom').textContent = inicio + 1;
    document.getElementById('showingTo').textContent = Math.min(fin, registrosFiltrados.length);
    document.getElementById('totalRecords').textContent = registrosFiltrados.length;
    
    // Actualizar botones de paginación
    actualizarPaginacion();
}

// Buscar en tabla
function buscarEnTabla() {
    const texto = document.getElementById('searchBox').value.toLowerCase();
    
    if (!texto) {
        mostrarDatos(todosLosRegistros);//registrosFiltrados = [...todosLosRegistros];
    } else {
        registrosFiltrados = todosLosRegistros.filter(registro => {
            const dni = String(registro.dni ?? '').toLowerCase();
            const nombre = String(registro.nombre ?? '').toLowerCase();
            const fecha = String(registro.fecha ?? '');

            return (
                dni.includes(texto) ||
                nombre.includes(texto) ||
                fecha.includes(texto)
            );
        });
    }
    
    paginaActual = 1;
    mostrarDatos();
}

// Aplicar filtros de fecha
function aplicarFiltros() {
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    
    registrosFiltrados = todosLosRegistros.filter(registro => {
        if (fechaDesde && registro.fecha < fechaDesde) return false;
        if (fechaHasta && registro.fecha > fechaHasta) return false;
        return true;
    });
    
    paginaActual = 1;
    mostrarDatos();
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('fechaDesde').value = '';
    document.getElementById('fechaHasta').value = '';
    document.getElementById('searchBox').value = '';
    
    registrosFiltrados = [...todosLosRegistros];
    paginaActual = 1;
    mostrarDatos();
}

// Cambiar cantidad de entradas por página
function cambiarEntradas() {
    registrosPorPagina = parseInt(document.getElementById('entriesPerPage').value);
    paginaActual = 1;
    mostrarDatos();
}

// Paginación
function paginaAnterior() {
    if (paginaActual > 1) {
        paginaActual--;
        mostrarDatos();
    }
}

function paginaSiguiente() {
    const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);
    if (paginaActual < totalPaginas) {
        paginaActual++;
        mostrarDatos();
    }
}

function actualizarPaginacion() {
    const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);
    
    document.getElementById('btnAnterior').disabled = paginaActual === 1;
    document.getElementById('btnSiguiente').disabled = paginaActual === totalPaginas;
    
    // Números de página
    const paginationNumbers = document.getElementById('paginationNumbers');
    paginationNumbers.innerHTML = '';
    
    for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'page-number';
        if (i === paginaActual) btn.classList.add('active');
        btn.onclick = () => {
            paginaActual = i;
            mostrarDatos();
        };
        paginationNumbers.appendChild(btn);
    }
}


// Funciones de control de Modales
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        
        // Si abres el modal de nuevo registro, inicializa el formulario
        if (modalId === 'nuevoRegistroModal') {
            document.getElementById('successMessage').textContent = '';
            document.getElementById('errorMessage').textContent = '';
            document.getElementById('attendanceForm').reset();
            document.getElementById('fecha').value = obtenerFechaActual();
            
            // Cargar empleados si no están cargados
            if (!empleadosCache) {
                cargarEmpleados();
            }
        }
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Variable para el índice a eliminar
let indiceAEliminar = null;

// Función para guardar desde el modal de nuevo registro
async function guardarNuevoRegistro() {
    const form = document.getElementById('attendanceForm');
    
    // Validar formulario HTML5
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const horaEntrada = document.getElementById('horaEntrada').value;
    const horaSalida = document.getElementById('horaSalida').value;
    
    // Validar que al menos haya una hora
    if (!horaEntrada && !horaSalida) {
        document.getElementById('errorMessage').textContent = 'Ingrese al menos hora de entrada o salida';
        document.getElementById('errorMessage').style.display = 'block';
        return;
    }
    
    // Mostrar loading
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    // Preparar datos
    const datos = {
        fecha: document.getElementById('fecha').value,
        dni: document.getElementById('dni').value,
        nombre: document.getElementById('nombre').value,
        horaEntrada: horaEntrada,
        horaSalida: horaSalida,
        turno: document.getElementById('turno').value,
        turnoIngeniero: document.getElementById('turnoIngeniero').value,
        observaciones: document.getElementById('observaciones').value
    };
    
    console.log('Guardando datos:', datos);
    
    // Guardar usando la función de api.js
    const resultado = await guardarAsistencia(datos);
    
    // Ocultar loading
    document.getElementById('loadingOverlay').style.display = 'none';
    
    if (resultado.success) {
        document.getElementById('successMessage').textContent = '✓ Registro guardado correctamente';
        document.getElementById('successMessage').style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
        
        // Esperar 1.5 segundos, cerrar modal y recargar
        setTimeout(() => {
            cerrarModal('nuevoRegistroModal');
            cargarDatos();
        }, 1500);
    } else {
        document.getElementById('errorMessage').textContent = '✗ Error al guardar el registro';
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
    }
}

// Funciones para editar registro
function editarRegistro(indice) {
    const registro = registrosFiltrados[indice];
    
    console.log('Editando registro:', registro);
    
    // Llenar formulario de edición
    document.getElementById('editIndex').value = indice;
    document.getElementById('editFecha').value = registro.fecha || '';
    document.getElementById('editDni').value = registro.dni || '';
    document.getElementById('editNombre').value = registro.nombre || '';
    document.getElementById('editHoraEntrada').value = registro.horaEntrada || '';
    document.getElementById('editHoraSalida').value = registro.horaSalida || '';
    document.getElementById('editObservaciones').value = registro.observaciones || '';
    
    // Llenar select de turno
    const turnosEdit = obtenerTurnos();
    llenarSelect(document.getElementById('editTurno'), turnosEdit);
    document.getElementById('editTurno').value = registro.turno || '';
    
    // Llenar select de ingeniero
    const ingTurnoEdit = obtenerIngTurno();
    llenarSelect(document.getElementById('editTurnoIngeniero'), ingTurnoEdit);
    document.getElementById('editTurnoIngeniero').value = registro.turnoIngeniero || '';
    
    // Abrir modal
    abrirModal('modalEditar');
}

// Guardar edición
async function guardarEdicion() {
    const indice = parseInt(document.getElementById('editIndex').value);
    const registro = registrosFiltrados[indice];
    
    // Preparar datos actualizados
    const datosActualizados = {
        fecha: document.getElementById('editFecha').value,
        dni: document.getElementById('editDni').value,
        nombre: document.getElementById('editNombre').value,
        horaEntrada: document.getElementById('editHoraEntrada').value,
        horaSalida: document.getElementById('editHoraSalida').value,
        turno: document.getElementById('editTurno').value,
        turnoIngeniero: document.getElementById('editTurnoIngeniero').value,
        observaciones: document.getElementById('editObservaciones').value
    };
    
    console.log('Actualizando con datos:', datosActualizados);
    
    // Mostrar loading
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        // Calcular horas
        const calculo = calcularHoras(datosActualizados.horaEntrada, datosActualizados.horaSalida);
        
        // Agregar cálculos
        datosActualizados.totalHoras = calculo ? calculo.totalHoras : '-';
        datosActualizados.horasNormales = calculo ? calculo.horasNormales : '0';
        datosActualizados.horasExtra50 = calculo ? calculo.horasExtra50 : '0';
        datosActualizados.horasExtra100 = calculo ? calculo.horasExtra100 : '0';
        datosActualizados.veinticincoNocturno = calculo ? calculo.veinticincoNocturno : '0';
        datosActualizados.veinticinco5am7pm = calculo ? calculo.veinticinco5am7pm : '0';
        datosActualizados.cincuenta7pm5am = calculo ? calculo.cincuenta7pm5am : '0';
        datosActualizados.prolongacionNoct75 = calculo ? calculo.prolongacionNoct75 : '0';
        datosActualizados.feriadosDomingos100 = calculo ? calculo.feriadosDomingos100 : '0';
        
        // USAR filaSheet (número de fila real en Google Sheets)
        await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'actualizarAsistencia',
                indiceFila: registro.filaSheet,  // ← CAMBIO CLAVE AQUÍ
                datos: datosActualizados
            })
        });
        
        alert('✓ Registro actualizado correctamente');
        cerrarModal('modalEditar');
        
        // Recargar datos
        await cargarDatos();
        
    } catch (error) {
        console.error('Error:', error);
        alert('✗ Error al actualizar el registro');
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Eliminar registro
function eliminarRegistro(indice) {
    indiceAEliminar = indice;
    abrirModal('modalEliminar');
}

// Confirmar eliminación
async function confirmarEliminar() {
    if (indiceAEliminar === null) return;
    
    const registro = registrosFiltrados[indiceAEliminar];
    
    console.log('Eliminando registro:', registro);
    
    // Mostrar loading
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'eliminarAsistencia',
                indiceFila: registro.filaSheet  // ← USAR filaSheet
            })
        });
        
        alert('✓ Registro eliminado correctamente');
        cerrarModal('modalEliminar');
        
        // Recargar datos
        await cargarDatos();
        
    } catch (error) {
        console.error('Error:', error);
        alert('✗ Error al eliminar el registro');
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
        indiceAEliminar = null;
    }
}


// Exportar a Excel
function exportarExcel() {
    if (registrosFiltrados.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    let csv = 'Fecha,DNI,Nombre,Entrada,Salida,Total Horas,Turno,Observaciones\n';
    
    registrosFiltrados.forEach(r => {
        csv += `${r.fecha},${r.dni},${r.nombre},${r.horaEntrada},${r.horaSalida},${r.totalHoras},${r.turno},"${r.observaciones || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// Ordenar tabla (simplificado)
function ordenarTabla(columna) {
    console.log('Ordenar por:', columna);
    // Implementar después si es necesario
}