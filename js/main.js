//1. variables globales importantes
let actividades = [];
let filtroActual = 'todas'; 
let textoBusquedaActual = '';
let ordenarPor = 'fecha';
let idActividadEditando = null;

//2. funciones basicas de ayuda
function cargarActividades(){
    const almacenado = localStorage.getItem('actividadesData');
    if (almacenado) {
        actividades = JSON.parse(almacenado);
    }
}

function guardarActividades(){
    localStorage.setItem('actividadesData', JSON.stringify(actividades));
}

function generarIdUnico(){
    return Date.now() + Math.floor(Math.random() * 99);
}

//3. logica de actualizacion visual

function actualizarEstadisticas(){
    const estadisticaTotal = document.getElementById('statTotal');
    const estadisticaCompletadas = document.getElementById('statCompleted');
    const estadisticaPendientes = document.getElementById('statPending');
    const estadisticaHoras = document.getElementById('statHours');
    
    let sumaTotalHoras = 0;
    let contadorCompletadas = 0;

    for(const actividad of actividades){
        if (actividad.isCompleted){
            contadorCompletadas++;
        }
        
        const tiempo = parseFloat(actividad.estimatedTime);
        if(!isNaN(tiempo) && tiempo > 0){
            sumaTotalHoras += tiempo;
        }
    }

    estadisticaTotal.textContent = actividades.length;
    estadisticaCompletadas.textContent = contadorCompletadas;
    estadisticaPendientes.textContent = actividades.length - contadorCompletadas;
    estadisticaHoras.textContent = sumaTotalHoras.toFixed(1);
}

function renderizarTablaActividades(){
    let listaFiltrada = [];

    for(const actividad of actividades){
        let pasaFiltroEstado = true;
        let pasaFiltroBusqueda = true;

        if(filtroActual === 'pendientes' && actividad.isCompleted){
            pasaFiltroEstado = false;
        }else if(filtroActual === 'completadas' && !actividad.isCompleted){
            pasaFiltroEstado = false;
        }

        if(textoBusquedaActual.length > 0){
            const busqueda = textoBusquedaActual.toLowerCase();
            const title = actividad.title.toLowerCase();
            const subject = actividad.subject.toLowerCase();
            
            if(!title.includes(busqueda) && !subject.includes(busqueda)){
                pasaFiltroBusqueda = false;
            }
        }

        if(pasaFiltroEstado && pasaFiltroBusqueda){
            listaFiltrada.push(actividad);
        }
    }

    listaFiltrada.sort((a, b) =>{
        if(ordenarPor === 'fecha'){
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        }else if (ordenarPor === 'prioridad'){
            const valoresPrioridad = { 'alta': 3, 'media': 2, 'baja': 1 };
            const valA = valoresPrioridad[a.priority] || 0;
            const valB = valoresPrioridad[b.priority] || 0;
            return valB - valA;
        }else if(ordenarPor === 'titulo'){
            return a.title.localeCompare(b.title);
        }
        return 0;
    });

    const cuerpoTablaActividades = document.getElementById('activityTableBody');
    const plantillaFila = document.getElementById('rowTemplate');
    const estadoVacio = document.getElementById('emptyState');

    cuerpoTablaActividades.innerHTML = '';

    if(listaFiltrada.length === 0){
        estadoVacio.classList.remove('hidden');
    }else{
        estadoVacio.classList.add('hidden');

        for(const actividad of listaFiltrada){
            const clone = plantillaFila.content.cloneNode(true);
            const fila = clone.querySelector('tr');
            
            fila.dataset.id = actividad.id;
            
            fila.classList.add(`priority-${actividad.priority}`);
            if(actividad.isImportant){
                fila.classList.add('is-important');
            }
            if(actividad.isCompleted){
                fila.classList.add('is-completed');
            }

            const checkbox = fila.querySelector('.row-complete');
            checkbox.checked = actividad.isCompleted;

            fila.querySelector('.row-title').textContent = actividad.title;
            fila.querySelector('.row-subject').textContent = actividad.subject;
            fila.querySelector('.row-type').textContent = actividad.type;
            
            const badge = fila.querySelector('.badge--priority');
            badge.textContent = actividad.priority;
            
            fila.querySelector('.row-deadline').textContent = actividad.deadline || 'N/A';
            fila.querySelector('.row-time').textContent = actividad.estimatedTime !== null ? actividad.estimatedTime.toFixed(1) : 'N/A';

            cuerpoTablaActividades.appendChild(fila);
        }
    }
    actualizarEstadisticas();
}

//4. manejadores de eventos de formulario y tabla

function manejarAgregarActividad(e){
    e.preventDefault(); 

    const formularioActividad = document.getElementById('activityForm');

    const title = formularioActividad.title.value.trim();
    const subject = formularioActividad.subject.value.trim();
    const type = formularioActividad.type.value;
    const estimatedTimeValue = formularioActividad.estimatedTime.value;
    const deadline = formularioActividad.deadline.value;
    const notes = formularioActividad.notes.value.trim();
    const isImportant = formularioActividad.isImportant.checked;
    
    const priority = formularioActividad.querySelector('input[name="priority"]:checked').value;
    
    if(title === ''){
        alert('ERROR: El titulo es obligatorio. Por favor, escriba algo'); 
        formularioActividad.title.focus();
        return;
    }
    
    const time = estimatedTimeValue ? parseFloat(estimatedTimeValue) : null;
    if(time !== null && (isNaN(time) || time < 0)){
        alert('ERROR: El tiempo estimado debe ser un nro positivo (ej: 1.5)');
        formularioActividad.estimatedTime.focus();
        return;
    }

    const nuevaActividad ={
        id: generarIdUnico(),
        title: title,
        subject: subject,
        type: type,
        priority: priority,
        deadline: deadline,
        estimatedTime: time,
        notes: notes,
        isImportant: isImportant,
        isCompleted: false,
    };

    actividades.push(nuevaActividad);
    guardarActividades();
    renderizarTablaActividades();
    
    formularioActividad.reset();
}

function manejarInteraccionesTabla(e){
    const target = e.target;
    const fila = target.closest('tr');
    if(!fila) return;

    const idActividad = parseInt(fila.dataset.id);
    const indice = actividades.findIndex(a => a.id === idActividad);
    
    if(indice === -1) return; 
    const actividad = actividades[indice];

    if(target.classList.contains('btn-delete')){
        console.warn(`[Planificador] eliminando actividad: ${idActividad}`); 
        
        actividades.splice(indice, 1);
        guardarActividades();
        renderizarTablaActividades();
        return;
    }

    if(target.classList.contains('row-complete') && target.type === 'checkbox'){
        actividad.isCompleted = target.checked;
        guardarActividades();

        if(actividad.isCompleted){
            fila.classList.add('is-completed');
        } else{
            fila.classList.remove('is-completed');
        }

        if(filtroActual !== 'todas') {
            renderizarTablaActividades();
        } else {
            actualizarEstadisticas();
        }
        return;
    }

    if(target.classList.contains('btn-edit')){
        abrirModalEdicion(idActividad);
        return;
    }
}

//5. manejadores de evento de filtros, orden y busqueda

function manejarCambioFiltro(e){
    const target = e.target;
    const nuevoFiltro = target.dataset.filter;

    if(nuevoFiltro && nuevoFiltro !== filtroActual){
        filtroActual = nuevoFiltro;
        
        const botonesFiltro = document.querySelectorAll('.btn-filter');
        botonesFiltro.forEach(btn => btn.classList.remove('is-active'));
        target.classList.add('is-active');

        renderizarTablaActividades();
    }
}

function manejarInputBusqueda(e){
    textoBusquedaActual = e.target.value.trim();
    renderizarTablaActividades(); 
}

function manejarCambioOrden(e){
    ordenarPor = e.target.value;
    renderizarTablaActividades(); 
}