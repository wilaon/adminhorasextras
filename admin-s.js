// admin-simple.js

// Variables globales
let todosLosRegistros = [];
let registrosFiltrados = [];
let paginaActual = 1;
let registrosPorPagina = 20;
let sesionActual = null;
let usuarioLogueado = null;
let tablaDataTable = null;

let colaboradoresLote = [];
let turnosConfig = {
  "13:00-20:00": 1,
  "14:00-21:00": 2,
  "17:00-23:00": 6,
  "18:00-00:00": 6,
  "00:00-06:00": 6,
};

// Verificar sesión al cargar
function verificarSesion() {
  const sesionStr = localStorage.getItem("sesion");

  if (!sesionStr) {
    window.location.href = "login.html";
    return null;
  }

  const sesion = JSON.parse(sesionStr);

  // Verificar si la sesión no ha expirado (24 horas)
  const ahora = new Date().getTime();
  const tiempoExpiracion = 1 * 60 * 60 * 1000; // 1 hora

  if (ahora - sesion.timestamp > tiempoExpiracion) {
    cerrarSesion();
    return null;
  }

  return sesion;
}

function obtenerUsuarioLogueado() {
  const sesionStr = localStorage.getItem("sesion");

  if (!sesionStr) {
    alert(" No hay sesión activa");
    window.location.href = "login.html";
    return null;
  }

  try {
    usuarioLogueado = JSON.parse(sesionStr);
    return usuarioLogueado;
  } catch (error) {
    console.error("Error al leer sesión:", error);
    localStorage.removeItem("sesion");
    window.location.href = "login.html";
    return null;
  }
}

function cerrarSesion() {
  localStorage.removeItem("sesion");
  window.location.href = "login.html";
}

async function obtenerSedeUsuario(dni) {
  try {
    console.log("Consultando sede para DNI:", dni);

    const response = await fetch(
      `${
        CONFIG.GOOGLE_SCRIPT_URL
      }?action=getSedeUsuario&dni=${encodeURIComponent(dni)}`
    );
    const data = await response.json();

    if (data.success) {
      return data;
    } else {
      console.error("Error:", data.error);
      alert(" " + data.error);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener sede:", error);
    return null;
  }
}

// Mostrar información del usuario
function mostrarInfoUsuario(sesion) {
  const header = document.querySelector(".admin-header");
  const infoUsuario = document.createElement("div");
  infoUsuario.style.cssText = "display: flex; align-items: center; gap: 15px;";
  infoUsuario.innerHTML = `
        <span style="color: white; font-size: 14px; font-weight: 500;">
             ${sesion.nombre} 
            <span style="opacity: 0.9;">(${
              sesion.rol === "admin" ? "Administrador" : "Ingeniero"
            })</span>
        </span>
        <button onclick="cerrarSesion()" class="btn btn-secondary" style="padding: 8px 16px;">
             Cerrar Sesión
        </button>
    `;

  header.appendChild(infoUsuario);
}

function ordenarRegistroEstado(registros) {
  return registros.sort((a, b) => {
    const fechaA = a.fecha || "";
    const fechaB = b.fecha || "";

    if (fechaA != fechaB) {
      return fechaB.localeCompare(fechaA);
    }
    const nombreA = (a.nombre || "").toLowerCase();
    const nombreB = (b.nombre || "").toLowerCase();
    if (nombreA != nombreB) {
      return nombreA.localeCompare(nombreB);
    }
    const estadoA = (a.estado || "Pendiente").toLowerCase();
    const estadoB = (b.estado || "Pendiente").toLowerCase();
    const prioridad = {
      pendiente: 0,
      "": 0,
      aprobado: 1,
      rechazado: 2,
    };
    const prioridadA = prioridad[estadoA] ?? 0;
    const prioridadB = prioridad[estadoB] ?? 0;
    if (prioridadA != prioridadB) {
      return prioridadA - prioridadB;
    }
  });
}

// Función para cargar datos desde Google Sheets
async function cargarDatos() {
  console.log("Cargando datos...");

  try {
    // Mostrar loading
    document.getElementById("loadingOverlay").style.display = "flex";

    const sesion = verificarSesion();
    if (!sesion) {
      console.error(" No hay sesión válida");
      return;
    }

    let url = CONFIG.GOOGLE_SCRIPT_URL + "?action=obtenerAsistencias";
  
    if (sesion.rol !== "admin") {
      const nombreIngeniero = sesion.nombre || sesion.usuario;
      url += `&ingeniero=${encodeURIComponent(nombreIngeniero)}`;
      console.log(` Registros del ingeniero`);
    } else {
      console.log(" Modo Administrador ");
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.success && data.registros) {
      todosLosRegistros = ordenarRegistroEstado(data.registros);
      registrosFiltrados = [...todosLosRegistros];

      console.log(`Se cargaron ${todosLosRegistros.length} registros`);
      mostrarDatos();
    } else {
      alert("No se pudieron cargar los datos");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error al conectar con el servidor");
  } finally {
    // Ocultar loading
    document.getElementById("loadingOverlay").style.display = "none";
  }
}

// Función para mostrar datos en la tabla
function mostrarDatos() {
  if (tablaDataTable) {
    tablaDataTable.destroy();
  }
  const tbody = document.getElementById("tablaBody");
  tbody.innerHTML = "";

  if (registrosFiltrados.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="15" style="text-align: center;">No hay registros</td></tr>';
    return;
  }

  // Crear filas
  registrosFiltrados.forEach((registro, filaSheet) => {
    const tr = document.createElement("tr");

    // Determinar color de fondo según estado
    let colorFondo = "";
    const estado = (registro.estado || "").toLowerCase();
    if (estado === "aprobado") {
      colorFondo = "background-color: #97e5a9ff;";
    } else if (estado === "rechazado") {
      colorFondo = "background-color: #fa7575ff;";
    }
    tr.style = colorFondo;

    let botonesHTML = "";

    if (estado !== "aprobado") {
      botonesHTML += `<button class="btn btn-approve btn-aprobar" data-filasheet="${registro.filaSheet}" title="Aprobar">✓</button> `;
    }

    if (estado !== "rechazado") {
      botonesHTML += `<button class="btn btn-reject btn-rechazar" data-filasheet="${registro.filaSheet}" title="Rechazar">✗</button> `;
    }

    botonesHTML += `
            <button class="btn btn-edit btn-editar" data-filasheet="${registro.filaSheet}" title="Editar">✏️</button>
            <button class="btn btn-delete btn-eliminar" data-filasheet="${registro.filaSheet}" title="Eliminar">🗑️</button>
        `;

    tr.innerHTML = `
            <td>${registro.fecha || "-"}</td>
            <td>${registro.dni || "-"}</td>
            <td>${registro.nombre || "-"}</td>
            <td>${registro.turno || "-"}</td>
            <td>${registro.horaEntrada || "-"}</td>
            <td>${registro.horaSalida || "-"}</td>
            <td>${registro.totalHoras || "-"}</td>
            <td>${registro.turnoIngeniero || "-"}</td>
            <td>${registro.observaciones || "-"}</td>
            <td>${registro.veinticincoNocturno || "0"}</td>
            <td>${registro.veinticinco5am7pm || "0"}</td>
            <td>${registro.cincuenta7pm5am || "0"}</td>
            <td>${registro.prolongacionNoct75 || "0"}</td>
            <td>${registro.feriadosDomingos100 || "0"}</td>
           <td style="white-space: nowrap;">
            ${botonesHTML}
            </td>
        `;

    tbody.appendChild(tr);
  });

  tablaDataTable = $('#tablaAsistencias').DataTable({
    // Idioma en español
    language: {
        search: "🔍 Buscar:",
        lengthMenu: "Mostrar _MENU_ registros",
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
    pageLength: 20,
    lengthMenu: [[10, 20, 40, 100, -1], [10, 20, 40, 100, "Todos"]],
    
    // Ordenamiento por defecto (fecha descendente)
    order: [[0, 'desc']],
    
    // Configuración de columnas
    columnDefs: [
        { 
            targets: [14], // Columna de acciones
            orderable: false,
            searchable: false
        },
        {
            targets: [6, 9, 10, 11, 12, 13], // Columnas numéricas
            className: 'dt-center'
        }
    ],
    
    // DOM
    dom: '<"top" <"length-buttons-group"lB> f>rt<"bottom"ip><"clear">',
    
    // Botones de exportación
    buttons: [
        {
            extend: 'excelHtml5',
            text: '📊 Exportar a Excel',
            className: 'btn-success',
            title: 'Reporte_Horas_Extras',
            exportOptions: {
                columns: ':not(:last-child)' // Excluir colum acciones
            }
        }
    ],
    
    // CONFIGURACIÓN DE SCROLL CRÍTICA
    scrollX: true,
    scrollY: false, 
    scrollCollapse: false,
    paging: true,
    autoWidth: false,
    
    // Estado
    stateSave: true,
    stateDuration: -1,
    
    // Callbacks importantes
    drawCallback: function(settings) {
        // Ajustar columnas después de dibujar
        this.api().columns.adjust();
        
        // Calcular altura dinámica después del dibujo
        ajustarAlturaTabla();
    },
    
    initComplete: function() {
        // Ajustar al completar la inicialización
        this.api().columns.adjust().draw();
        
        // Configurar altura inicial
        ajustarAlturaTabla();
        
        // Reajustar en resize de ventana
        $(window).on('resize', function() {
            ajustarAlturaTabla();
        });
        
        console.log('✅ DataTable inicializada correctamente');
    }
});

aplicarAjustesDataTables();

// FUNCIÓN AUXILIAR PARA AJUSTAR LA ALTURA
function ajustarAlturaTabla() {
    setTimeout(function() {
        var containerHeight = $('.table-container').height();
        var headerHeight = $('.dataTables_scrollHead').outerHeight() || 0;
        var topHeight = $('.top').outerHeight() || 0;
        var bottomHeight = $('.bottom').outerHeight() || 50; // Mínimo 50px para la parte inferior
        
        // Calcular altura disponible para el body
        var availableHeight = containerHeight - headerHeight - topHeight - bottomHeight - 20; // 20px de margen
        
        // Aplicar solo si hay espacio disponible
        if (availableHeight > 100) {
            $('.dataTables_scrollBody').css('max-height', availableHeight + 'px');
            $('.dataTables_scrollBody').css('height', availableHeight + 'px');
        }
        
        // Asegurar que la parte inferior sea visible
        $('.bottom').css('position', 'relative');
        $('.bottom').css('z-index', '10');
        
        // Forzar el redibujado de DataTables
        if (tablaDataTable) {
            tablaDataTable.columns.adjust();
        }
    }, 100);
}

}

// Aplicar filtros de fecha
async function aplicarFiltros() {
  await cargarDatos();

  const fechaDesde = document.getElementById("fechaDesde").value;
  const fechaHasta = document.getElementById("fechaHasta").value;

  if (fechaDesde || fechaHasta) {
    registrosFiltrados = todosLosRegistros.filter((registro) => {
      if (fechaDesde && registro.fecha < fechaDesde) return false;
      if (fechaHasta && registro.fecha > fechaHasta) return false;
      return true;
    });
    mostrarDatos();
  }
}

// Limpiar filtros
function limpiarFiltros() {
  document.getElementById("fechaDesde").value = "";
  document.getElementById("fechaHasta").value = "";

  registrosFiltrados = [...todosLosRegistros];
  mostrarDatos();
}

// Funciones de control de Modales
async function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";

    // Si abres el modal de nuevo registro, inicializa el formulario
    if (modalId === "nuevoRegistroModal") {
      document.getElementById("successMessage").textContent = "";
      document.getElementById("errorMessage").textContent = "";
      document.getElementById("successMessage").style.display = "none";
      document.getElementById("errorMessage").style.display = "none";
      document.getElementById("attendanceForm").reset();
      document.getElementById("fecha").value = obtenerFechaActual();

      await llenarSelectTurnos(document.getElementById("turno"));
      await llenarSelectIngenieros(document.getElementById("turnoIngeniero"));

      const dniValidation = document.getElementById("dniValidation");
      if (dniValidation) {
        dniValidation.classList.remove("show");
      }
    }
  }
}

// Función para guardar desde el modal de nuevo registro
async function guardarNuevoRegistro() {
  const form = document.getElementById("attendanceForm");
  // Validar formulario HTML5
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const horaEntrada = document.getElementById("horaEntrada").value;
  const horaSalida = document.getElementById("horaSalida").value;

  // Validar que al menos haya una hora
  if (!horaEntrada && !horaSalida) {
    document.getElementById("errorMessage").textContent =
      "Ingrese al menos hora de entrada o salida";
    document.getElementById("errorMessage").style.display = "block";
    return;
  }
  // Mostrar loading
  document.getElementById("loadingOverlay").style.display = "flex";
  // Preparar datos
  const datos = {
    fecha: document.getElementById("fecha").value,
    dni: document.getElementById("dni").value,
    nombre: document.getElementById("nombre").value,
    horaEntrada: horaEntrada,
    horaSalida: horaSalida,
    turno: document.getElementById("turno").value,
    turnoIngeniero: document.getElementById("turnoIngeniero").value,
    observaciones: document.getElementById("observaciones").value,
  };

  try {
    // Guardar usando la función de api.js
    const resultado = await guardarAsistencia(datos);
    // Ocultar loading
    document.getElementById("loadingOverlay").style.display = "none";

    if (resultado.success) {
      document.getElementById("successMessage").textContent =
        "✓ Registro guardado correctamente";
      document.getElementById("successMessage").style.display = "block";

      await cargarDatos(true);
      // Esperar 1 segundos, cerrar modal y recargar
      setTimeout(() => {
        cerrarModal("nuevoRegistroModal");
      }, 800);
    } else {
      document.getElementById("errorMessage").textContent =
        "✗ Error al guardar el registro";
      document.getElementById("errorMessage").style.display = "block";
    }
  } catch (error) {
    document.getElementById("errorMessage").textContent =
      "✗ Error: " + error.message;
    document.getElementById("errorMessage").style.display = "block";
  } finally {
    document.getElementById("loadingOverlay").style.display = "none";
  }
}

// editar registro
async function editarRegistro(filaSheet) {

  const registro = registrosFiltrados.find(r => r.filaSheet === filaSheet);
  
  if (!registro) {
    alert('Registro no encontrado');
    return;
  }

  const modal = document.getElementById('modalEditar');
  modal.setAttribute('data-fila-editar', filaSheet);

  // Llenar formulario de edición
  document.getElementById("editIndex").value = filaSheet;
  document.getElementById("editFecha").value = registro.fecha || "";
  document.getElementById("editDni").value = registro.dni || "";
  document.getElementById("editNombre").value = registro.nombre || "";
  document.getElementById("editHoraEntrada").value = registro.horaEntrada || "";
  document.getElementById("editHoraSalida").value = registro.horaSalida || "";
  document.getElementById("editObservaciones").value =registro.observaciones || "";
  document.getElementById("editEstado").value = registro.estado || "Pendiente";
  document.getElementById("editTurno").value = registro.turno || "";
  document.getElementById("editTurnoIngeniero").value = registro.turnoIngeniero || "";

  abrirModal("modalEditar");
}

async function guardarEdicion() {

  const modal = document.getElementById('modalEditar');
  const indiceFila = parseInt(modal.getAttribute('data-fila-editar'));

  if (!indiceFila || indiceFila < 2) {
    alert('Error: No se encontró el registro a editar');
    return;
  }
  const datos = {
    fecha: document.getElementById('editFecha').value,
    dni: document.getElementById('editDni').value,
    nombre: document.getElementById('editNombre').value,
    horaEntrada: document.getElementById('editHoraEntrada').value || "",
    horaSalida: document.getElementById('editHoraSalida').value || "",
    turno: document.getElementById('editTurno').value,
    turnoIngeniero: document.getElementById('editTurnoIngeniero').value,
    observaciones: document.getElementById('editObservaciones').value,
    estado: document.getElementById('editEstado').value
  };
  console.log('datos a enviar:',datos)
  
  if (!datos.fecha || !datos.turno || !datos.turnoIngeniero) {
    alert('Complete los campos requeridos');
    return;
  }
  mostrarLoading(true);
  try {

    console.log('Llamando actualizarAsistencia con indiceFila:', indiceFila);
    const result = await actualizarAsistencia(indiceFila, datos);

    alert('✓ Registro actualizado correctamente');
    cerrarModal('modalEditar');
    await cargarDatos();
    
    
  } catch (error) {
    console.error('Error guardando edición:', error);
    alert('Error: ' + error.message);
  } finally {
    modal.removeAttribute('data-fila-editar');
    mostrarLoading(false);
  }
}


// Variable para el índice a eliminar
let indiceAEliminar = null;

// Eliminar registro
function eliminarRegistro(filaSheet) {
  console.log('📋 Intentando eliminar fila:', filaSheet);
  
  if (!filaSheet || filaSheet < 2) {
    alert('Error: No se puede eliminar este registro (índice inválido)');
    console.error('Índice inválido recibido:', filaSheet);
    return;
  }

  //indiceAEliminar = filaSheet;
  const modal = document.getElementById('modalEliminar');
  modal.setAttribute('data-fila-eliminar', filaSheet);
  abrirModal("modalEliminar");
}

// Confirmar eliminación
async function confirmarEliminar() {
  const modal = document.getElementById('modalEliminar');
  const indiceAEliminar = parseInt(modal.getAttribute('data-fila-eliminar'));
  
  if (!indiceAEliminar || indiceAEliminar < 2) {
    alert('Error: Índice de fila inválido');
    console.error('Índice inválido:', indiceAEliminar);
    cerrarModal('modalEliminar');
    return;
  }
  
  cerrarModal('modalEliminar');
  mostrarLoading(true);
  
  try {
    console.log(' Eliminando fila:', indiceAEliminar);
    const result = await eliminarAsistencia(indiceAEliminar);
    
    if (result.success) {
      console.log('✓ Registro eliminado correctamente');
      await cargarDatos();
    } else {
      alert('Error al eliminar: ' + (result.error || 'Error desconocido'));
    }
    
  } catch (error) {
    console.error('Error eliminando:', error);
    alert('Error: ' + error.message);
  } finally {
    modal.removeAttribute('data-fila-eliminar');
    mostrarLoading(false);
  }
}

async function aprobarRegistro(filaSheet) {
  if (!filaSheet || filaSheet < 2) {
    console.error('Número de fila inválido');
    alert('Error: Número de fila inválido');
    return;
  }
  
  mostrarLoading(true);
  
  try {

    const result = await cambiarEstado(filaSheet, 'Aprobado');
    
    // 🆕 NUEVO: Verifica resultado
    if (result.success) {
      console.log('✓ Registro aprobado correctamente');
      await cargarDatos();
    } else {
      alert('Error al aprobar: ' + (result.error || 'Error desconocido'));
    }
    
  } catch (error) {
    console.error('Error en aprobar', error);
    alert('Error: ' + error.message);
  } finally {
    mostrarLoading(false);
  }
}

async function rechazarRegistro(filaSheet) {
  if (!filaSheet || filaSheet < 2) {
    console.error('Número de fila inválido');
    alert('Error: Número de fila inválido');
    return;
  }
  
  const confirmar = confirm('¿Está seguro de rechazar esta solicitud?');
  if (!confirmar) return;
  
  mostrarLoading(true);
  
  try {

    const result = await cambiarEstado(filaSheet, 'Rechazado');
    
    if (result.success) {
      console.log('✓ Registro rechazado correctamente');
      await cargarDatos();
    } else {
      alert('Error al rechazar: ' + (result.error || 'Error desconocido'));
    }
    
  } catch (error) {
    console.error('Error en rechazar', error);
    alert('Error: ' + error.message);
  } finally {
    mostrarLoading(false);
  }
}



function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
  // Limpiar formularios dentro de la modal
  const forms = modal.querySelectorAll("form");
  forms.forEach((form) => {
    // Resetear formulario
    form.reset();

    // Remover validación HTML5 de todos los campos
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.setCustomValidity("");
      if (input.hasAttribute("required")) {
        input.removeAttribute("required");
      }
    });
  });

  // Limpiar variables globales
  if (modalId === "modalEditar") indiceEditando = null;
  if (modalId === "modalEliminar") indiceAEliminar = null;
  if (modalId === "modalInsertarLote") colaboradoresLote = [];
}

function mostrarLoading(mostrar) {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.style.display = mostrar ? "flex" : "none";
  }
}

// Exportar a Excel
function exportarExcel() {
  if (tablaDataTable) {
    tablaDataTable.button(".buttons-excel").trigger();
  } else {
    alert("La tabla no está inicializada");
  }
}

/*// GENERAR REPORTE MENSUAL
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

*/

$(document).ready(function () {
  // Escucha clics en la tabla para los botones de acción
  const tablaSelector = "#tablaAsistencias";

  // Botón APROBAR
  $(document).on("click", tablaSelector + " .btn-aprobar", function () {
    // Obtenemos el ID de la fila desde el atributo data-filasheet
    const filaSheet = $(this).data("filasheet");
    if (filaSheet >= 0) {
      aprobarRegistro(filaSheet);
    } else {
      console.error("ID de fila no encontrado para aprobar.");
    }
  });

  // Botón RECHAZAR
  $(document).on("click", tablaSelector + " .btn-rechazar", function () {
    const filaSheet = $(this).data("filasheet");
    if (filaSheet >= 0) {
      rechazarRegistro(filaSheet);
    } else {
      console.error("ID de fila no encontrado para rechazar.");
    }
  });

  // Botón EDITAR
  $(document).on("click", tablaSelector + " .btn-editar", function () {
    const filaSheet = $(this).data("filasheet");
    if (filaSheet >= 0) {
      editarRegistro(filaSheet);
    } else {
      console.error("ID de fila no encontrado para editar.");
    }
  });

  // Botón ELIMINAR
  $(document).on("click", tablaSelector + " .btn-eliminar", function () {
    const filaSheet = $(this).data("filasheet");
    if (filaSheet >= 0) {
      eliminarRegistro(filaSheet);
    } else {
      console.error("ID de fila no encontrado para eliminar.");
    }
  });
});

// Abrir modal de inserción en lote
async function abrirModalInsertarLote() {
  const modal = document.getElementById("modalInsertarLote");
  modal.style.display = "flex";

  // Establecer mes actual
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
  document.getElementById("loteMes").value = mesActual;

  // Cargar ingenieros
  await llenarSelectIngenieros(document.getElementById("loteIngeniero"));

  // Cargar turnos como radio buttons
  cargarTurnosRadio();

  // Cargar colaboradores
  await cargarColaboradoresLote();

  // Actualizar resumen
  actualizarResumenLote();
}

// Cargar turnos como radio buttons
function cargarTurnosRadio() {
  const container = document.getElementById("turnosRadios");
  container.innerHTML = "";

  Object.keys(turnosConfig).forEach((turno, index) => {
    const horas = turnosConfig[turno];
    const div = document.createElement("div");
    div.innerHTML = `
      <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; background: white;">
        <input type="radio" name="turnoLote" value="${turno}" data-horas="${horas}" ${
      index === 0 ? "checked" : ""
    } onchange="actualizarResumenLote()">
        <span><strong>${turno}</strong> (${horas}h)</span>
      </label>
    `;
    container.appendChild(div);
  });
}

// Cargar colaboradores para el lote
async function cargarColaboradoresLote() {
  const container = document.getElementById("listaColaboradoresLote");
  container.innerHTML =
    '<div style="text-align: center; color: #666;">Cargando...</div>';

  try {
    const response = await fetch(
      `${CONFIG.GOOGLE_SCRIPT_URL}?action=getEmpleados`
    );
    const data = await response.json();

    if (data.success && data.empleados) {
      colaboradoresLote = Object.values(data.empleados).sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );

      container.innerHTML = "";

      colaboradoresLote.forEach((emp, index) => {
        const div = document.createElement("div");
        div.style.cssText =
          "padding: 8px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px;";
        div.innerHTML = `
          <input type="checkbox" class="chkColaborador" data-index="${index}" onchange="actualizarResumenLote()">
          <span style="min-width: 150px; font-family: monospace;">${emp.DNI}</span>
          <span>${emp.nombre}</span>
        `;
        container.appendChild(div);
      });
    }
  } catch (error) {
    console.error("Error cargando colaboradores:", error);
    container.innerHTML =
      '<div style="color: red;">Error al cargar colaboradores</div>';
  }
}

// Seleccionar todos los colaboradores
function seleccionarTodosColaboradores() {
  document
    .querySelectorAll(".chkColaborador")
    .forEach((chk) => (chk.checked = true));
  actualizarResumenLote();
}

// Deseleccionar todos los colaboradores
function deseleccionarTodosColaboradores() {
  document
    .querySelectorAll(".chkColaborador")
    .forEach((chk) => (chk.checked = false));
  actualizarResumenLote();
}

// Actualizar resumen en tiempo real
function actualizarResumenLote() {
  const seleccionados = document.querySelectorAll(
    ".chkColaborador:checked"
  ).length;
  const dias = parseInt(document.getElementById("loteDias").value) || 0;
  const turnoRadio = document.querySelector('input[name="turnoLote"]:checked');
  const horasPorTurno = turnoRadio ? parseInt(turnoRadio.dataset.horas) : 0;

  const horasPorColaborador = dias * horasPorTurno;
  const totalHoras = seleccionados * horasPorColaborador;

  document.getElementById("totalSeleccionados").textContent = seleccionados;
  document.getElementById("horasPorColaborador").textContent =horasPorColaborador;
  document.getElementById("totalRegistros").textContent = seleccionados;
  document.getElementById("totalHorasLote").textContent = totalHoras;
}

// Confirmar e insertar registros en lote
async function confirmarInsertarLote() {

  const mes = document.getElementById("loteMes").value;
  const dias = parseInt(document.getElementById("loteDias").value);
  const ingeniero = document.getElementById("loteIngeniero").value;
  const turnoRadio = document.querySelector('input[name="turnoLote"]:checked');

  if (!mes || !dias || !ingeniero || !turnoRadio) {
    alert("Complete todos los campos requeridos");
    return;
  }
 
  const seleccionados = [];
  document.querySelectorAll(".chkColaborador:checked").forEach((chk) => {
    const index = parseInt(chk.dataset.index);
    seleccionados.push(colaboradoresLote[index]);
  });

  if (seleccionados.length === 0) {
    alert("Seleccione al menos un colaborador");
    return;
  }

  const turno = turnoRadio.value;
  const horasPorTurno = parseInt(turnoRadio.dataset.horas);
  const totalHoras = seleccionados.length * dias * horasPorTurno;

  // Confirmación
  const confirmar = confirm(
    `¿Confirmar inserción?\n\n` +
      `Colaboradores: ${seleccionados.length}\n` +
      `Turno: ${turno}\n` +
      `Días: ${dias}\n` +
      `Horas por colaborador: ${dias * horasPorTurno}\n` +
      `Total horas: ${totalHoras}\n\n` +
      `Se crearán ${seleccionados.length} registros.`
  );

  if (!confirmar) return;

  // Mostrar loading
  mostrarLoading(true);
  document.getElementById("btnConfirmarLote").disabled = true;

  try {
    // Calcular fecha (último día del mes)
    const [año, mesNum] = mes.split("-");
    const ultimoDiaMes = new Date(año, mesNum, 0).getDate();
    const fechaRegistro = `${año}-${mesNum}-${String(ultimoDiaMes).padStart(2,"0")}`;

    // Preparar datos para enviar
    const datosLote = {
      action: "insertarLoteHoras25",
      fecha: fechaRegistro,
      turno: turno,
      ingeniero: ingeniero,
      dias: dias,
      horasPorTurno: horasPorTurno,
      colaboradores: seleccionados.map((emp) => ({
        dni: emp.DNI,
        nombre: emp.nombre,
      })),
    };

    const result = await insertarLoteHoras25(datosLote)

    if (result.success) {
      alert(`✓ ${result.registrosCreados} registros insertados exitosamente`);
      cerrarModal("modalInsertarLote");
      await cargarDatos();
    } else {
      alert('Error: ' + (result.error || 'Error desconocido'));
    }

  } catch (error) {
    console.error("Error:", error);
    alert("Error al insertar registros: " + error.message);
  } finally {
    mostrarLoading(false);
    document.getElementById("btnConfirmarLote").disabled = false;
  }
}

// Event listener para actualizar resumen cuando cambian los días
document.addEventListener("DOMContentLoaded", function () {
  const diasInput = document.getElementById("loteDias");
  if (diasInput) {
    diasInput.addEventListener("input", actualizarResumenLote);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════

// Función principal - Se ejecuta cuando carga la página
window.onload = async function () {
  console.log("Página cargada, iniciando...");

  sesionActual = verificarSesion();
  if (!sesionActual) return;

  mostrarInfoUsuario(sesionActual);

  // Establecer fechas por defecto
  const hoy = new Date();
  const hace30Dias = new Date();
  hace30Dias.setDate(hoy.getDate() - 30);

  document.getElementById("fechaDesde").value = hace30Dias.toISOString().split("T")[0];
  document.getElementById("fechaHasta").value = hoy.toISOString().split("T")[0];

  try {
    await Promise.all([
      cargarDatos(),
      llenarSelectTurnos(document.getElementById("editTurno")),
      llenarSelectIngenieros(document.getElementById("editTurnoIngeniero")),
    ]);

    const btnGuardarEdicion = document.getElementById("btnGuardarEdicion");
    if (btnGuardarEdicion) {
      btnGuardarEdicion.onclick = async function () {
        await guardarEdicion();
      };
    }

    console.log(" Sistema iniciado correctamente");
  } catch (error) {
    console.error(" Error en inicialización:", error);
    alert("Error al iniciar el sistema. Recargue la página.");
  }
};
