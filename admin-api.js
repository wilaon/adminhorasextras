let registrosHorasExtras = [];

async function cargarRegistros() {
    try {
        // Mostrar loading mientras carga
        mostrarLoading(true);

        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=obtenerAsistencias`);
        const data = await response.json();

        if (data.success) {
            registrosHorasExtras = data.registro || [];
            mostrarRegistrosEnTabla(registrosHorasExtras);
            console.log("Se cargaron los registros");
        } else {
            alert("Error al cargar los registros")
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el servidor');
    } finally {
        // Siempre ocultar loading al final
        mostrarLoading(false);
    }
}



async function actualizaRegistros(indice, datosActualizados) {
    try {
        mostrarLoading(true);
        // Preparar los datos para enviar
        const payload = {
            action: 'actualizarAsistencia',
            indice: indice + 2, // +2 porque en Sheets la fila 1 son headers y arrays empiezan en 0
            datos: datosActualizados
        };
        
        // Enviar petición POST
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        // Como usamos no-cors, asumimos éxito
        alert('Registro actualizado correctamente');
        
        // Recargar la tabla
        await obtenerRegistros();
    } catch (error) {
        onsole.error('Error:', error);
        alert('Error al actualizar el registro');
    }finally{
        mostrarLoading(false)
    }
}



async function eliminarRegistro(indice) {
    try {
        mostrarLoading(true);
        
        // Preparar datos
        const payload = {
            action: 'eliminarAsistencia',
            indice: indice + 2 // +2 por headers y base 0
        };
        
        // Enviar petición
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        alert('Registro eliminado correctamente');
        
        // Recargar tabla
        await obtenerRegistros();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el registro');
    } finally {
        mostrarLoading(false);
    }
}



function mostrarLoading(mostrar) {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.style.display = mostrar ? 'flex' : 'none';
    }
}