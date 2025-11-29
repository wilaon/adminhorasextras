function aplicarAjustesDataTables() {
    // Si existe la tabla DataTables
    if (tablaDataTable) {
        // Ajustar anchos de columnas específicas
        tablaDataTable.columns(0).width('50px');  // Fecha
        tablaDataTable.columns(1).width('90px');  // DNI
        tablaDataTable.columns(2).width('200px'); // Nombre
        tablaDataTable.columns(3).width('90px');  // Turno
        
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