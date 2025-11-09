// admin-simple.js - Todo en un archivo para evitar conflictos

// Variables globales
let todosLosRegistros = [];
let registrosFiltrados = [];
let paginaActual = 1;
let registrosPorPagina = 20;
let sesionActual = null;
let usuarioLogueado= null;
let tablaDataTable = null;


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


function obtenerUsuarioLogueado() {
    const sesionStr = localStorage.getItem('sesion');
    
    if (!sesionStr) {
        alert(' No hay sesión activa');
        window.location.href = 'login.html';
        return null;
    }
    
    try {
        usuarioLogueado = JSON.parse(sesionStr);
        console.log(' Usuario logueado:', usuarioLogueado.user);
        console.log(' DNI:', usuarioLogueado.dni);
        console.log(' Rol:', usuarioLogueado.rol);
        return usuarioLogueado;
    } catch (error) {
        console.error('Error al leer sesión:', error);
        localStorage.removeItem('sesion');
        window.location.href = 'login.html';
        return null;
    }
}



async function obtenerSedeUsuario(dni) {
    try {
        console.log('Consultando sede para DNI:', dni);
        
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getSedeUsuario&dni=${encodeURIComponent(dni)}`);
        const data = await response.json();
        
        if (data.success) {
            console.log(' Es Admin:', data.esAdmin);
            return data;
        } else {
            console.error('Error:', data.error);
            alert('❌ ' + data.error);
            return null;
        }
    } catch (error) {
        console.error('Error al obtener sede:', error);
        return null;
    }
}



async function cargarSedes() {
    try {
        
        // Obtener usuario logueado
        const usuario = obtenerUsuarioLogueado();
        if (!usuario) return;
        
        // Obtener información de sede del usuario
        const infoSede = await obtenerSedeUsuario(usuario.dni);
        if (!infoSede) {
            alert(' No se pudo obtener información de sede');
            return;
        }
        
        const selectSede = document.getElementById('sedeReporte');
        selectSede.innerHTML = '';
        
        // Si es ADMIN → Cargar todas las sedes
        if (infoSede.esAdmin) {
            console.log(' Usuario es ADMIN - Acceso a todas las sedes');
            
            const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getSedes`);
            const data = await response.json();
            
            if (data.success && data.sedes) {
                // Opción para todas las sedes
                selectSede.innerHTML = '<option value=""> Seleccionar </option>';
                
                // Agregar cada sede
                data.sedes.forEach(sede => {
                    const option = document.createElement('option');
                    option.value = sede.id;
                    option.textContent = sede.nombre;
                    selectSede.appendChild(option);
                });
                
                console.log(' Sedes cargadas:', data.sedes.length);
                console.log(' Select habilitado - Puede cambiar sede');
            }
        } 
        
        else {
            console.log(' Usuario normal - Solo su sede');
            
            const option = document.createElement('option');
            option.value = infoSede.sedeId;
            option.textContent = infoSede.sedeNombre;
            option.selected = true;
            selectSede.appendChild(option);
            
            
            selectSede.disabled = true;
            selectSede.style.backgroundColor = '#f0f0f0';
            selectSede.style.cursor = 'not-allowed';
            
            console.log(' Sede cargada:', infoSede.sedeNombre);
            console.log(' Select bloqueado - No puede cambiar sede');
        }
        
    } catch (error) {
        console.error('Error al cargar sedes:', error);
        alert(' Error al cargar sedes');
    }
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
             ${sesion.nombre} 
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

    const mesActual = hoy.toISOString().slice(0, 7); // Formato: YYYY-MM
    document.getElementById('mesReporte').value = mesActual;
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    document.getElementById('fechaDesde').value = hace30Dias.toISOString().split('T')[0];
    document.getElementById('fechaHasta').value = hoy.toISOString().split('T')[0];


    cargarSedes();
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

    if (tablaDataTable) {
        tablaDataTable.destroy();
    }
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    if (registrosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="15" style="text-align: center;">No hay registros</td></tr>';
        return;
    }
    
    // Crear filas
    registrosFiltrados.forEach((registro, index) => {
        const tr = document.createElement('tr');
        
        // Determinar color de fondo según estado
        let colorFondo = '';
        const estado = (registro.estado || '').toLowerCase();
        if (estado === 'aprobado') {
            colorFondo = 'background-color: #97e5a9ff;'; 
        } else if (estado === 'rechazado') {
            colorFondo = 'background-color: #fa7575ff;'; 
        }
        tr.style = colorFondo;



        let botonesHTML = '';

        // Botón APROBAR (✓) - Solo visible si NO está 'aprobado'. Sí es visible si está 'rechazado'
        if (estado !== 'aprobado') {
            botonesHTML += `<button class="btn btn-approve btn-aprobar" data-filasheet="${index}" title="Aprobar">✓</button> `;
        }
        
        // Botón RECHAZAR (✗) - Visible si NO está 'rechazado'.
        if (estado !== 'rechazado') {
            botonesHTML += `<button class="btn btn-reject btn-rechazar" data-filasheet="${index}" title="Rechazar">✗</button> `;
        }
        
        // Botones EDITAR (✏️) y ELIMINAR (🗑️) - Siempre visibles, independientemente del estado.
        botonesHTML += `
            <button class="btn btn-edit btn-editar" data-filasheet="${index}" title="Editar">✏️</button>
            <button class="btn btn-delete btn-eliminar" data-filasheet="${index}" title="Eliminar">🗑️</button>
        `;

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
            <td>${registro.veinticincoNocturno || '0'}</td>
            <td>${registro.veinticinco5am7pm || '0'}</td>
            <td>${registro.cincuenta7pm5am || '0'}</td>
            <td>${registro.prolongacionNoct75 || '0'}</td>
            <td>${registro.feriadosDomingos100 || '0'}</td>
           <td style="white-space: nowrap;">
            ${botonesHTML}
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // AGREGADO: Inicializar DataTables
    tablaDataTable = $('#tablaAsistencias').DataTable({
        // Idioma en español
        language: {
            search: "🔍 Buscar:",
            lengthMenu: "Mostrar _MENU_ registros por página",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            paginate: {
                first: "Primero",
                last: "Último",
                next: "Siguiente",
                previous: "Anterior"
            },
            zeroRecords: "No se encontraron registros",
            emptyTable: "No hay datos disponibles"
        },
        // Paginación
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
        // Ordenamiento por defecto (fecha descendente)
        order: [[0, 'desc']],
        // Configuración de columnas
        columnDefs: [
            { 
                targets: [14], // Columna de acciones
                orderable: false,
                searchable: false,
            },
            {
                targets: [6, 9, 10, 11, 12, 13], // Columnas numéricas
                className: 'dt-center'
            }
        ],
        
        // Botones de exportación
        dom:   '<"top d-flex justify-content-between align-items-center"<"d-flex align-items-center gap-3"B l>f>rt<"bottom"ip><"clear">',
        buttons: [
            {
                extend: 'excelHtml5',
                text: '📊 Exportar a Excel',
                className: 'btn btn-success',
                title: 'Reporte_Horas_Extras',
                exportOptions: {
                    columns: ':not(:last-child)' // Excluir columna de acciones
                }
            }
        ],  
        // Ajuste de columnas
        autoWidth: false,
        scrollX: true,
        // Mantener estado entre recargas
        stateSave: true,
        stateDuration: -1, // Guardar indefinidamente
        // Diseño responsive
        responsive: false


    });
}



$(document).ready(function() {
    // Escucha clics en la tabla para los botones de acción
    const tablaSelector = '#tablaAsistencias'; 

    // Botón APROBAR
    $(document).on('click', tablaSelector + ' .btn-aprobar', function() {
        // Obtenemos el ID de la fila desde el atributo data-filasheet
        const filaSheet = $(this).data('filasheet');
        if ((filaSheet>=0)) {
            aprobarRegistro(filaSheet);
        } else {
             console.error("ID de fila no encontrado para aprobar.");
        }
    });

    // Botón RECHAZAR
    $(document).on('click', tablaSelector + ' .btn-rechazar', function() {
        const filaSheet = $(this).data('filasheet');
        if ((filaSheet>=0)) {
            rechazarRegistro(filaSheet);
        } else {
             console.error("ID de fila no encontrado para rechazar.");
        }
    });

    // Botón EDITAR
    $(document).on('click', tablaSelector + ' .btn-editar', function() {
        const filaSheet = $(this).data('filasheet');
        if ((filaSheet>=0)) {
            editarRegistro(filaSheet);
        } else {
             console.error("ID de fila no encontrado para editar.");
        }
    });

    // Botón ELIMINAR
    $(document).on('click', tablaSelector + ' .btn-eliminar', function() {
        const filaSheet = $(this).data('filasheet');
        if ((filaSheet>=0)) {
            eliminarRegistro(filaSheet);
        } else {
             console.error("ID de fila no encontrado para eliminar.");
        }
    });

});



async function aprobarRegistro(indice) {
    const registro = registrosFiltrados[indice];
    await cambiarEstadoRegistro(registro.filaSheet, 'Aprobado');
}


async function rechazarRegistro(indice) {
    const registro = registrosFiltrados[indice];
    if (!confirm('¿Está seguro de rechazar esta solicitud?')) return;
    
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


// Aplicar filtros de fecha
function aplicarFiltros() {
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    
    registrosFiltrados = todosLosRegistros.filter(registro => {
        if (fechaDesde && registro.fecha < fechaDesde) return false;
        if (fechaHasta && registro.fecha > fechaHasta) return false;
        return true;
    });    
    mostrarDatos();
}


// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('fechaDesde').value = '';
    document.getElementById('fechaHasta').value = '';
    
    registrosFiltrados = [...todosLosRegistros];
    mostrarDatos();
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
       
        }
    }
}


function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}




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
    document.getElementById('editEstado').value = registro.estado || 'Pendiente';
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
        observaciones: document.getElementById('editObservaciones').value,
        estado: document.getElementById('editEstado').value
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
            console.log(' Registro actualizado correctamente');
            await new Promise(resolve =>setTimeout(resolve,1000));
            // Cerrar modal
            cerrarModal('modalEditar');
            // Recargar datos
            await cargarDatos();
        } else {
            console.error('Error del servidor:', resultado.error);
            alert('✗ Error: ' + resultado.error);
        }
        
    } catch (error) {
        console.error(' Error:', error);
        alert('✗ Error al actualizar: ' + error.message);
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
}


// Variable para el índice a eliminar
let indiceAEliminar = null;


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

    if (tablaDataTable) {
        tablaDataTable.button('.buttons-excel').trigger();
    } else {
        alert('La tabla no está inicializada');
    }
    
}


// GENERAR REPORTE MENSUAL
async function generarReporteMensual() {
    const mesReporte = document.getElementById('mesReporte').value;
    const sedeId = document.getElementById('sedeReporte').value;

    if (!mesReporte) {
        alert('Selecciona un mes para el reporte');
        return;
    }
    if (!sedeId) {
        const usuario = obtenerUsuarioLogueado();
        if (usuario && usuario.rol !== 'admin') {
            alert('Seleccione la SEDE');
            return;
        }
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