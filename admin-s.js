// admin-simple.js - Todo en un archivo para evitar conflictos

// Variables globales
let todosLosRegistros = [];
let registrosFiltrados = [];
let paginaActual = 1;
let registrosPorPagina = 25;
let sesionActual = null;



// Verificar sesión al cargar
function verificarSesion() {
    const sesionStr = localStorage.getItem('sesion');
    
    if (!sesionStr) {
        window.location.href = 'login.html';
        return null;
    }
    
    const sesion = JSON.parse(sesionStr);
    
    // Verificar si la sesión no ha expirado (24 horas)
    const ahora = new Date().getTime();
    const tiempoExpiracion = 1 * 60 * 60 * 1000; // 24 horas
    
    if (ahora - sesion.timestamp > tiempoExpiracion) {
        cerrarSesion();
        return null;
    }
    
    return sesion;
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('sesion');
    window.location.href = 'login.html';
}




// Mostrar información del usuario
function mostrarInfoUsuario(sesion) {
    const header = document.querySelector('.admin-header');
    const infoUsuario = document.createElement('div');
    infoUsuario.style.cssText = 'display: flex; align-items: center; gap: 15px;';
    infoUsuario.innerHTML = `
        <span style="color: white; font-size: 14px; font-weight: 500;">
            👤 ${sesion.nombre} 
            <span style="opacity: 0.9;">(${sesion.rol === 'admin' ? 'Administrador' : 'Ingeniero'})</span>
        </span>
        <button onclick="cerrarSesion()" class="btn btn-secondary" style="padding: 8px 16px;">
             Cerrar Sesión
        </button>
    `;
    
    header.appendChild(infoUsuario);
}



// Función principal - Se ejecuta cuando carga la página
window.onload = function() {
    console.log('Página cargada, iniciando...');
    
    sesionActual = verificarSesion();
    if (!sesionActual) return;

    mostrarInfoUsuario(sesionActual);
    
    // Establecer fechas por defecto
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    document.getElementById('fechaDesde').value = hace30Dias.toISOString().split('T')[0];
    document.getElementById('fechaHasta').value = hoy.toISOString().split('T')[0];
    
    // Cargar datos
    cargarDatos();
};


function ordenarRegistroEstado(registros){
    return registros.sort((a,b)=> {

        const fechaA = a.fecha || '';
        const fechaB = b.fecha || '';

        if (fechaA != fechaB) {
            return fechaB.localeCompare(fechaA)
        }

        const nombreA = (a.nombre || '').toLowerCase();
        const nombreB = (b.nombre || '').toLowerCase();
        if (nombreA != nombreB) {
          return nombreA.localeCompare(nombreB)  
        }
        
        
        const estadoA = (a.estado || 'Pendiente').toLowerCase();
        const estadoB = (a.estado || 'Pendiente').toLowerCase();
        const prioridad = {
            'pendiente':0,
            '':0,
            'aprobado':1,
            'rechazado':2
        };

        const prioridadA = prioridad[estadoA] ?? 0;
        const prioridadB = prioridad[estadoB] ?? 0;
        if (prioridadA != prioridadB) {
            return prioridadA -prioridadB;
        }

        
    });

}

// Función para cargar datos desde Google Sheets
async function cargarDatos() {
    console.log('Cargando datos...');
    
    try {
        // Mostrar loading
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        const url = CONFIG.GOOGLE_SCRIPT_URL + '?action=obtenerAsistencias';
        
        const response = await fetch(url);
        const data = await response.json();
        
        
        if (data.success && data.registros) {
            todosLosRegistros = ordenarRegistroEstado( data.registros);
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

    // Filtrar por ingeniero si no es admin
    let registrosMostrar = [...registrosFiltrados];
    if (sesionActual && sesionActual.rol !== 'admin') {
        registrosMostrar = registrosFiltrados.filter(r => {
            const turnoIng = (r.turnoIngeniero || '').replace(/^Ing\.\s*/i, '').trim();
            const sesionUser = (sesionActual.user || '').replace(/^Ing\.\s*/i, '').trim();
            
            return turnoIng.toLowerCase() === sesionUser.toLowerCase();
    });
    console.log(`Ingeniero ${sesionActual.user} - Registros filtrados:`, registrosMostrar.length);
    }
    
    // Calcular qué registros mostrar según la página
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const registrosPagina = registrosMostrar.slice(inicio, fin);
    
    if (registrosPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="16" style="text-align: center;">No hay registros</td></tr>';
        // Actualizar contadores en 0
        document.getElementById('showingFrom').textContent = '0';
        document.getElementById('showingTo').textContent = '0';
        document.getElementById('totalRecords').textContent = '0';
        return;
    }


    registrosPagina.forEach((registro) => {
    const indiceReal = registrosFiltrados.indexOf(registro);
        
    const tr = document.createElement('tr');

    const estado = registro.estado || 'Pendiente';
    if (estado === 'Aprobado') {
        tr.style.backgroundColor = '#d4edda'; // Verde claro
    } else if (estado === 'Rechazado') {
        tr.style.backgroundColor = '#f8d7da'; // Rojo claro
    }


    tr.innerHTML = `
        <td>${registro.fecha || '-'}</td>
        <td>${registro.dni || '-'}</td>
        <td>${registro.nombre || '-'}</td>
        <td>${registro.turno || '-'}</td>
        <td>${registro.horaEntrada || '-'}</td>
        <td>${registro.horaSalida || '-'}</td>
        <td>${registro.totalHoras || '-'}</td>
        <td>${registro.turnoIngeniero || '-'}</td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${registro.observaciones}">${registro.observaciones || '-'}</td>
        <td>${registro.veinticincoNocturno || '0'}</td>
        <td>${registro.veinticinco5am7pm || '0'}</td>
        <td>${registro.cincuenta7pm5am || '0'}</td>
        <td>${registro.prolongacionNoct75 || '0'}</td>
        <td>${registro.feriadosDomingos100 || '0'}</td>
        <td>
            <button class="btn-edit" onclick="editarRegistro(${indiceReal})" title="Editar">✏️</button>
            <button class="btn-delete" onclick="eliminarRegistro(${indiceReal})" title="Eliminar">🗑️</button>
            ${estado === 'Pendiente' ? `
                    <button class="btn-approve" onclick="aprobarRegistro(${indiceReal})" title="Aprobar">✓</button>
                    <button class="btn-reject" onclick="rechazarRegistro(${indiceReal})" title="Rechazar">✗</button>
                ` : `
                    <span class="badge badge-${estado === 'Aprobado' ? 'success' : 'danger'}">${estado}</span>
                `}
        </td>
        `;
        
        tbody.appendChild(tr);
    });

    
    // Actualizar info de paginación
    document.getElementById('showingFrom').textContent = registrosMostrar.length > 0 ? inicio + 1 : 0;
    document.getElementById('showingTo').textContent = Math.min(fin, registrosMostrar.length);
    document.getElementById('totalRecords').textContent = registrosMostrar.length;
    
    // Actualizar botones de paginación
    actualizarPaginacion();
}




async function aprobarRegistro(indice) {
    const registro = registrosFiltrados[indice];
    await cambiarEstadoRegistro(registro.filaSheet, 'Aprobado');
}


async function rechazarRegistro(indice) {
    if (!confirm('¿Está seguro de rechazar esta solicitud?')) return;
    const registro = registrosFiltrados[indice];
    await cambiarEstadoRegistro(registro.filaSheet, 'Rechazado');
}


async function cambiarEstadoRegistro(filaSheet, nuevoEstado) {
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        const url = `${CONFIG.GOOGLE_SCRIPT_URL}?action=cambiarEstado&indiceFila=${filaSheet}&estado=${nuevoEstado}`;
        
        const response = await fetch(url);
        const resultado = await response.json();
        
        if (resultado.success) {
            console.log(`✓ Estado cambiado a: ${nuevoEstado}`);
            await cargarDatos();
        } else {
            alert('✗ Error: ' + resultado.error);
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('✗ Error al cambiar estado');
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}





// Buscar en tabla
function buscarEnTabla() {
    const texto = document.getElementById('searchBox').value.toLowerCase();
    
    if (!texto) {
        registrosFiltrados = [...todosLosRegistros];
    } else {
        const textoLimpio = texto.replace(/[-\s]/g, '');
        registrosFiltrados = todosLosRegistros.filter(registro => {
            const dni = String(registro.dni ?? '').toLowerCase().replace(/[-\s]/g, '');
            const nombre = String(registro.nombre ?? '').toLowerCase();
            const fecha = String(registro.fecha ?? '');
            const turno = String(registro.turno ?? '').toLowerCase();
            const ingeniero = String(registro.turnoIngeniero ?? '').toLowerCase();
            const estado = String(registro.estado ?? '').toLowerCase();

            return (
                dni.includes(textoLimpio) ||
                nombre.includes(texto) ||
                fecha.includes(texto) ||
                turno.includes(texto) ||
                ingeniero.includes(texto) ||
                estado.includes(texto)
            );
        });
        registrosFiltrados = ordenarRegistroEstado(registrosFiltrados)
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
     let registrosMostrar = [...registrosFiltrados];
    if (sesionActual && sesionActual.rol !== 'admin') {
        registrosMostrar = registrosMostrar.filter(r => {
            const turnoIng = (r.turnoIngeniero || '').replace(/^Ing\.\s*/i, '').trim();
            const sesionUser = (sesionActual.user || '').replace(/^Ing\.\s*/i, '').trim();
            return turnoIng.toLowerCase() === sesionUser.toLowerCase();
        });
    }
    
    const totalPaginas = Math.ceil(registrosMostrar.length / registrosPorPagina);
    if (paginaActual < totalPaginas) {
        paginaActual++;
        mostrarDatos();
    }
}

function actualizarPaginacion() {
    // APLICAR EL MISMO FILTRO AQUÍ
    let registrosMostrar = [...registrosFiltrados];
    if (sesionActual && sesionActual.rol !== 'admin') {
        registrosMostrar = registrosMostrar.filter(r => {
            const turnoIng = (r.turnoIngeniero || '').replace(/^Ing\.\s*/i, '').trim();
            const sesionUser = (sesionActual.user || '').replace(/^Ing\.\s*/i, '').trim();
            return turnoIng.toLowerCase() === sesionUser.toLowerCase();
        });
    }
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
async function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        
        // Si abres el modal de nuevo registro, inicializa el formulario
        if (modalId === 'nuevoRegistroModal') {
            document.getElementById('successMessage').textContent = '';
            document.getElementById('errorMessage').textContent = '';
            document.getElementById('successMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('attendanceForm').reset();
            document.getElementById('fecha').value = obtenerFechaActual();
            
            // CARGAR TURNOS E INGENIEROS DINÁMICAMENTE
            await llenarSelectTurnos(document.getElementById('turno'));
            await llenarSelectIngenieros(document.getElementById('turnoIngeniero'));
            
            const dniValidation = document.getElementById('dniValidation');
            if (dniValidation) {
                dniValidation.classList.remove('show');
            }

            // Cargar empleados si no están cargados
            /*if (!empleadosCache) {
                cargarEmpleados();
            }*/
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
        document.getElementById('successMessage').style.display = 'none';
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
    
    
    
    // Guardar usando la función de api.js
    const resultado = await guardarAsistencia(datos);
    
    // Ocultar loading
    document.getElementById('loadingOverlay').style.display = 'none';
    
    if (resultado.success) {
        document.getElementById('successMessage').textContent = '✓ Registro guardado correctamente';
        document.getElementById('successMessage').style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
        
        // Esperar 1 segundos, cerrar modal y recargar
        setTimeout(() => {
            cerrarModal('nuevoRegistroModal');
            cargarDatos();
        }, 1000);
    } else {
        document.getElementById('errorMessage').textContent = '✗ Error al guardar el registro';
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
    }
}

// editar registro
async function editarRegistro(indice) {
    const registro = registrosFiltrados[indice];
    
    
    
    // Llenar formulario de edición
    document.getElementById('editIndex').value = indice;
    document.getElementById('editFecha').value = registro.fecha || '';
    document.getElementById('editDni').value = registro.dni || '';
    document.getElementById('editNombre').value = registro.nombre || '';
    document.getElementById('editHoraEntrada').value = registro.horaEntrada || '';
    document.getElementById('editHoraSalida').value = registro.horaSalida || '';
    document.getElementById('editObservaciones').value = registro.observaciones || '';

    // Abrir modal
    const modalEditar = document.getElementById('modalEditar');
    if (modalEditar) {
        modalEditar.style.display = 'block';
    }
    
    /// CARGAR TURNOS E INGENIEROS DINÁMICAMENTE
    await llenarSelectTurnos(document.getElementById('editTurno'));
    document.getElementById('editTurno').value = registro.turno || '';
    
    await llenarSelectIngenieros(document.getElementById('editTurnoIngeniero'));
    document.getElementById('editTurnoIngeniero').value = registro.turnoIngeniero || '';
    
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
    
    // Mostrar loading
    document.getElementById('loadingOverlay').style.display = 'flex';

    try {

        // USANDO GET
        
        const url = `${CONFIG.GOOGLE_SCRIPT_URL}?action=actualizarAsistencia&indiceFila=${registro.filaSheet}&datos=${encodeURIComponent(JSON.stringify(datosActualizados))}`;
        
        console.log('Actualizando registro...');
        
        // Hacer la petición GET
        const response = await fetch(url);
        
        // Leer la respuesta
        const resultado = await response.json();
        
        console.log('Respuesta:', resultado);
        
        // Verificar si fue exitoso
        if (resultado.success) {


            console.log('✓ Registro actualizado correctamente');
            await new Promise(resolve =>setTimeout(resolve,2000));

            // Cerrar modal
            cerrarModal('modalEditar');
            
            // Recargar datos
            await cargarDatos();
            
        } else {
            console.error('Error del servidor:', resultado.error);
            alert('✗ Error: ' + resultado.error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('✗ Error al actualizar: ' + error.message);
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
    
    console.log('Eliminando registro:');
    
    // Mostrar loading
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        
        const url = `${CONFIG.GOOGLE_SCRIPT_URL}?action=eliminarAsistencia&indiceFila=${registro.filaSheet}`;
        
        const response = await fetch(url);
        const resultado = await response.json();
        
        console.log('Respuesta del servidor:', resultado);
        
        if (resultado.success) {
            console.log('✓ Registro eliminado correctamente');
            
            // Cerrar modal
            cerrarModal('modalEliminar');
            
            // Limpiar variable
            indiceAEliminar = null;
            
            // Recargar datos
            await cargarDatos();
            
        } else {
            console.error('Error del servidor:', resultado.error);
            alert('✗ Error al eliminar: ' + resultado.error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('✗ Error de conexión: ' + error.message);
    } finally {
        // Ocultar loading
        document.getElementById('loadingOverlay').style.display = 'none';
    }

}


// Exportar a Excel
function exportarExcel() {
    let registrosExportar = [...registrosFiltrados];
    
    // Si es ingeniero, filtrar sus registros
    if (sesionActual && sesionActual.rol !== 'admin') {
        registrosExportar = registrosExportar.filter(r => {
            const turnoIng = (r.turnoIngeniero || '').replace(/^Ing\.\s*/i, '').trim();
            const sesionUser = (sesionActual.user || '').replace(/^Ing\.\s*/i, '').trim();
            return turnoIng.toLowerCase() === sesionUser.toLowerCase();
        });
        console.log(`Exportando ${registrosExportar.length} registros del ingeniero ${sesionActual.user}`);
    }
    
    if (registrosExportar.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // BOM para UTF-8 (para que Excel reconozca acentos)
    let csv = '\uFEFF';
    
    // Encabezados
    csv += 'Fecha,DNI,Nombre,Turno,Hora Entrada,Hora Salida,Total Horas,,Ingeniero de Turno,Observaciones,';
    csv += '25% Nocturno,25% (5am-7pm),50% (7pm-5am),75% Prolongación Nocturna,100% Feriados/Domingos\n';
    
    // Datos
    registrosExportar.forEach(r => {
        csv += `${r.fecha || ''},`;
        csv += `${r.dni || ''},`;
        csv += `"${r.nombre || ''}",`;  // Comillas para nombres con comas
        csv += `${r.turno || ''},`;
        csv += `${r.horaEntrada || ''},`;
        csv += `${r.horaSalida || ''},`;
        csv += `${r.totalHoras || ''},`;
        csv += `"${r.turnoIngeniero || ''}",`;  // Comillas para nombres con comas
        csv += `"${(r.observaciones || '').replace(/"/g, '""')}",`;  // Escapar comillas dobles
        csv += `${r.veinticincoNocturno || '0'},`;
        csv += `${r.veinticinco5am7pm || '0'},`;
        csv += `${r.cincuenta7pm5am || '0'},`;
        csv += `${r.prolongacionNoct75 || '0'},`;
        csv += `${r.feriadosDomingos100 || '0'}\n`;
    });
    
    // Crear archivo con codificación UTF-8
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Nombre del archivo con fecha y usuario
    const fechaHoy = new Date().toISOString().split('T')[0];
    const nombreUsuario = sesionActual.rol === 'admin' ? 'todos' : sesionActual.user.replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `horas_extras_${nombreUsuario}_${fechaHoy}.csv`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✓ Exportados ${registrosExportar.length} registros a CSV`);
}



// GENERAR REPORTE MENSUAL
// ============================================
async function generarReporteMensual() {
    const mesReporte = document.getElementById('mesReporte').value;
    
    if (!mesReporte) {
        alert('Selecciona un mes para el reporte');
        return;
    }
    
    console.log('Generando reporte para:', mesReporte);
    
    // Mostrar loading
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        const url = `${CONFIG.GOOGLE_SCRIPT_URL}?action=generarReporteMensual&mes=${mesReporte}`;
        
        console.log('Llamando a:', url);
        
        const response = await fetch(url);
        const resultado = await response.json();
        
        console.log('Respuesta:', resultado);
        
        if (resultado.success) {
            console.log(`✓ Reporte generado con ${resultado.empleados} empleados`);
            
            const fileId = resultado.url.match(/\/d\/(.+?)\//)[1];
            const downloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
            
            
            window.open(downloadUrl, '_blank');
            
            alert(`✓ Reporte generado exitosamente\n\n` +
                  `Empleados: ${resultado.empleados}\n` +
                  `Archivo: ${resultado.nombreArchivo}\n\n` +
                  `Se abrirá en una nueva pestaña donde puedes descargarlo como Excel.`);
        } else {
            alert('✗ Error: ' + resultado.error);
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('✗ Error al generar reporte: ' + error.message);
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}