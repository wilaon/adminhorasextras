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
            <td>${registro.horaEntrada || '-'}</td>
            <td>${registro.horaSalida || '-'}</td>
            <td>${registro.totalHoras || '-'}</td>
            <td>${registro.turno || '-'}</td>
            <td>${registro.observaciones || '-'}</td>
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

// Funciones para editar y eliminar (básicas por ahora)
function editarRegistro(indice) {
    alert('Función de editar en desarrollo. Índice: ' + indice);
}

function eliminarRegistro(indice) {
    if (confirm('¿Está seguro de eliminar este registro?')) {
        alert('Función de eliminar en desarrollo. Índice: ' + indice);
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