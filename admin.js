let registrosFiltrados = [];      // Registros después de aplicar filtros
let paginaActual = 1;            // Página actual de la tabla
let registrosPorPagina = 10;     // Cuántos registros mostrar por página
let ordenActual = {              // Para ordenar columnas
    columna: null,
    ascendente: true
};
let indiceEditar = null;        // Índice del registro que se está editando
let indiceEliminar = null;      // Índice del registro a eliminar


document.addEventListener('DOMContentLoaded',function(){
    console.log('Panel de administración cargado');
    
    // Establecer fechas por defecto (últimos 30 días)
    establecerFechasPorDefecto();
    
    // Cargar los registros
    obtenerRegistros();
});


function mostrarRegistrosEnTabla(registros) {
    registrosFiltrados = registros;

    // Calcular índices para paginación
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const registrosPagina = registrosFiltrados.slice(inicio, fin);

      // Obtener el tbody de la tabla
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = ''; // Limpiar tabla

    if (registrosPagina === 0) {
        tbody.innerHTML = '<tr><td colspan ="9"style="text-align: center;">No hay registros para mostrar</td></tr>'
        actualizarInfoPaginacion(0,0,0);
        return;
    }

    //Crea una fila por registro
    registrosPagina.forEach((registro,index) => {
        const indiceReal = inicio + index; // Índice real en el array completo
        const fila = document.createElement('tr');
        fila.innerHTML= `
            <td>${registro.fecha || '-'}</td>
            <td>${registro.dni || '-'}</td>
            <td>${registro.nombre || '-'}</td>
            <td>${registro.horaEntrada || '-'}</td>
            <td>${registro.horaSalida || '-'}</td>
            <td>${registro.totalHoras || '-'}</td>
            <td>${registro.turno || '-'}</td>
            <td>${registro.observaciones || '-'}</td>
            <td>
                <button class="btn btn-edit" onclick="abrirModalEditar(${indiceReal})">Edit</button>
                <button class="btn btn-delete" onclick="abrirModalEliminar(${indiceReal})">Del</button>
            </td>
        `;
        tbody.append(fila)
    });

    actualizarInfoPaginacion(inicio + 1,Math.min(fin,registrosFiltrados.length),registrosFiltrados.length)

    actualizarPaginacion();

}


function buscarTabla(){
    const textoBusqueda = document.getElementById('searchBox').value.toLowerCase();

    if(!textoBusqueda){
        mostrarRegistrosEnTabla(registrosHorasExtras);
        return;
    }
    
    // Filtrar registros que contengan el texto en cualquier campo
    const registrosFiltrados = registrosHorasExtras.filter(registro => {
        return (
            registro.dni.toLowerCase().includes(textoBusqueda) ||
            registro.nombre.toLowerCase().includes(textoBusqueda) ||
            registro.fecha.includes(textoBusqueda) ||
            registro.turno.toLowerCase().includes(textoBusqueda)
        );
         });
    
    // Resetear a página 1 y mostrar resultados
    paginaActual = 1;
    mostrarRegistrosEnTabla(registrosFiltrados);
}


// FILTROS POR FECHA
// ============================================
function aplicarFiltros() {
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    
    let registrosFiltrados = [...registrosHorasExtras];
    
    // Filtrar por fecha desde
    if (fechaDesde) {
        registrosFiltrados = registrosFiltrados.filter(registro => {
            return registro.fecha >= fechaDesde;
        });
    }
    
    // Filtrar por fecha hasta
    if (fechaHasta) {
        registrosFiltrados = registrosFiltrados.filter(registro => {
            return registro.fecha <= fechaHasta;
        });
    }
    
    // Aplicar también el filtro de búsqueda si existe
    const textoBusqueda = document.getElementById('searchBox').value;
    if (textoBusqueda) {
        document.getElementById('searchBox').value = textoBusqueda;
        buscarEnTabla();
    } else {
        paginaActual = 1;
        mostrarRegistrosEnTabla(registrosFiltrados);
    }
}


function limpiarFiltros(){
    document.getElementById('fechaDesde').value='';
    document.getElementById('fechaHasta').value='';
    document.getElementById('searchBox').value='';
    paginaActual = 1;
    mostrarRegistrosEnTabla(registrosHorasExtras)
}


// ORDENAR TABLA
// ============================================
function ordenarTabla(columna) {
    // Si es la misma columna, cambiar dirección
    if (ordenActual.columna === columna) {
        ordenActual.ascendente = !ordenActual.ascendente;
    } else {
        ordenActual.columna = columna;
        ordenActual.ascendente = true;
    }
    
    // Ordenar los registros
    registrosFiltrados.sort((a, b) => {
        let valorA = a[columna] || '';
        let valorB = b[columna] || '';
        
        // Comparar
        if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
        if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
        return 0;
    });
    
    // Mostrar tabla ordenada
    mostrarRegistrosEnTabla(registrosFiltrados);
}


// PAGINACIÓN
// ============================================
function cambiarEntradas() {
    registrosPorPagina = parseInt(document.getElementById('entriesPerPage').value);
    paginaActual = 1;
    mostrarRegistrosEnTabla(registrosFiltrados);
}

function paginaAnterior() {
    if (paginaActual > 1) {
        paginaActual--;
        mostrarRegistrosEnTabla(registrosFiltrados);
    }
}

function paginaSiguiente() {
    const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);
    if (paginaActual < totalPaginas) {
        paginaActual++;
        mostrarRegistrosEnTabla(registrosFiltrados);
    }
}

function irAPagina(pagina) {
    paginaActual = pagina;
    mostrarRegistrosEnTabla(registrosFiltrados);
}

function actualizarInfoPaginacion(desde, hasta, total) {
    document.getElementById('showingFrom').textContent = desde;
    document.getElementById('showingTo').textContent = hasta;
    document.getElementById('totalRecords').textContent = total;
}

function actualizarPaginacion() {
    const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);
    const paginationNumbers = document.getElementById('paginationNumbers');
    paginationNumbers.innerHTML = '';
    
    // Botón anterior
    document.getElementById('btnAnterior').disabled = paginaActual === 1;
    
    // Números de página (mostrar máximo 5)
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + 4);
    
    for (let i = inicio; i <= fin; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'page-number';
        if (i === paginaActual) btn.classList.add('active');
        btn.onclick = () => irAPagina(i);
        paginationNumbers.appendChild(btn);
    }
    
    // Botón siguiente
    document.getElementById('btnSiguiente').disabled = paginaActual === totalPaginas;
}



function modalEditar(indice) {
    indiceEditar = indice
    const registro = registrosFiltrados[indice];

    //Llena form con los dotos del registro a editar
    document.getElementById('editFecha').value = registro.fecha;
    document.getElementById('editDni').value = registro.dni;
    document.getElementById('editNombre').value = registro.nombre;
    document.getElementById('editHoraEntrada').value = registro.horaEntrada;
    document.getElementById('editHoraSalida').value = registro.horaSalida;
    document.getElementById('editTurno').value = registro.turno;
    document.getElementById('editObservaciones').value = registro.observaciones || '';

    document.getElementById('modalEditar').style.display = 'block';

}

function cerrarModal() {
    document.getElementById('modalEditar').style.display = 'none';
    indiceEditar = null;
}



async function guardarEdicion() {
    if (indiceEditar === null) return;
    
    // Obtener nuevos valores
    const datosActualizados = {
        fecha: document.getElementById('editFecha').value,
        dni: document.getElementById('editDni').value,
        nombre: document.getElementById('editNombre').value,
        horaEntrada: document.getElementById('editHoraEntrada').value,
        horaSalida: document.getElementById('editHoraSalida').value,
        turno: document.getElementById('editTurno').value,
        observaciones: document.getElementById('editObservaciones').value
    };
    
    // Calcular horas trabajadas
    const calculo = calcularHoras(datosActualizados.horaEntrada, datosActualizados.horaSalida);
    if (calculo) {
        datosActualizados.totalHoras = calculo.formatoTotal;
        datosActualizados.horasNormales = calculo.horasNormales.toFixed(2);
        datosActualizados.horasExtra50 = calculo.horasExtra50.toFixed(2);
        datosActualizados.horasExtra100 = calculo.horasExtra100.toFixed(2);
    }
    
    // Cerrar modal
    cerrarModal();
    
    // Actualizar en el servidor
    await actualizarRegistro(indiceEditar, datosActualizados);
}


// MODAL ELIMINAR
// ============================================

function abrirModalEliminar(indice) {
    indiceEliminar = indice;
    document.getElementById('modalEliminar').style.display ='block';
}

function cerrarModalEliminar() {
    indiceEliminar = indice;
    document.getElementById('modalEliminar').style.display ='none';

}


//--------------------------------------------
//-------------------------------------------

async function confirmarEliminar() {
    if (indiceAEliminar === null) return;
    
    cerrarModalEliminar();
    await eliminarRegistro(indiceAEliminar);
}

//-----------------------------------
//-----------------------------------
function establecerFechasPorDefecto() {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    document.getElementById('fechaDesde').value = hace30Dias.toISOString().split('T')[0];
    document.getElementById('fechaHasta').value = hoy.toISOString().split('T')[0];
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        cerrarModal();
        cerrarModalEliminar();
    }
}