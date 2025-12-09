function aplicarAjustesDataTables() {
    // Si existe la tabla DataTables
    if (tablaDataTable) {
        // Ajustar anchos de columnas específicas
        tablaDataTable.settings()[0].aoColumns[0].sWidth = '50px'; // Fecha
           tablaDataTable.settings()[0].aoColumns[1].sWidth = '90px'; // DNI
           tablaDataTable.settings()[0].aoColumns[2].sWidth = '200px'; // Nombre
           tablaDataTable.settings()[0].aoColumns[3].sWidth = '90px'; // Turno
        
        // Redibujar la tabla con los nuevos anchos
        tablaDataTable.columns.adjust().draw();
    }
}

// Modificar la función mostrarDatos original
const mostrarDatosOriginal = window.mostrarDatos;
window.mostrarDatos = function() {
    // Llamar a la función original
    mostrarDatosOriginal();
    
    // Aplicar ajustes adicionales
    setTimeout(aplicarAjustesDataTables, 100);
};