//variables globales importantes
let actividades = [];
let filtroActual = 'todas'; 
let textoBusquedaActual = '';
let ordenarPor = 'fecha';

//variable para saber si estoy editando alguna actividad (guardo el ID)
let idActividadEditando = null;

//-- funcion para guardar y leer del localStorage --

function cargarActividades(){
    //intento leer si hay algo guardado
    const almacenado = localStorage.getItem('actividadesData');
    if (almacenado) {
        actividades = JSON.parse(almacenado);
    }
}

function guardarActividades(){
    localStorage.setItem('actividadesData', JSON.stringify(actividades));
}

function generarIdUnico(){
    //uso la fecha actual + un nro random para que no se repita el ID
    return Date.now() + Math.floor(Math.random() * 99);
}

//-- logica de actualizacion visual y estadisticas --

function actualizarEstadisticas(){
    //elementos del DOM donde voy a mostrar los nros
    const estadisticaTotal = document.getElementById('statTotal');
    const estadisticaCompletadas = document.getElementById('statCompleted');
    const estadisticaPendientes = document.getElementById('statPending');
    const estadisticaHoras = document.getElementById('statHours');
    
    let sumaTotalHoras = 0;
    let contadorCompletadas = 0;

    //recorro el array para contar
    for(const actividad of actividades){
        if (actividad.isCompleted){
            contadorCompletadas++;
        }
        
        //sumo las horas solo si son nros validos
        const tiempo = parseFloat(actividad.estimatedTime);
        if(!isNaN(tiempo) && tiempo > 0){
            sumaTotalHoras += tiempo;
        }
    }

    //actualizo el HTML
    estadisticaTotal.textContent = actividades.length;
    estadisticaCompletadas.textContent = contadorCompletadas;
    estadisticaPendientes.textContent = actividades.length - contadorCompletadas;
    estadisticaHoras.textContent = sumaTotalHoras.toFixed(1);
}

function renderizarTablaActividades(){
    let listaFiltrada = [];

    //1. aplico los filtros (estado y busqueda)
    for(const actividad of actividades){
        let pasaFiltroEstado = true;
        let pasaFiltroBusqueda = true;

        //filtro por botones de estado
        if(filtroActual === 'pendientes' && actividad.isCompleted){
            pasaFiltroEstado = false;
        }else if(filtroActual === 'completadas' && !actividad.isCompleted){
            pasaFiltroEstado = false;
        }

        //filtro por buscador (input)
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

    //2. ordeno la lista segun lo que elije el usuario
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

    //3. dibujo en el HTML
    const cuerpoTablaActividades = document.getElementById('activityTableBody');
    const plantillaFila = document.getElementById('rowTemplate');
    const estadoVacio = document.getElementById('emptyState');

    cuerpoTablaActividades.innerHTML = ''; //limpio la tabla antes de dibujar

    if(listaFiltrada.length === 0){
        estadoVacio.classList.remove('hidden');
    }else{
        estadoVacio.classList.add('hidden');

        for(const actividad of listaFiltrada){
            //clono el template
            const clone = plantillaFila.content.cloneNode(true);
            const fila = clone.querySelector('tr');
            
            fila.dataset.id = actividad.id;
            
            //agrego clases visuales
            fila.classList.add(`priority-${actividad.priority}`);
            if(actividad.isImportant){
                fila.classList.add('is-important');
            }
            if(actividad.isCompleted){
                fila.classList.add('is-completed');
            }

            const checkbox = fila.querySelector('.row-complete');
            checkbox.checked = actividad.isCompleted;

            //relleno los datos
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
    //al final actualizo los contadores
    actualizarEstadisticas();
}

//-- manejo del formulario (agregar) --

function manejarAgregarActividad(e){
    e.preventDefault();//para que no recargue la pag

    const formularioActividad = document.getElementById('activityForm');

    //leo los valores
    const title = formularioActividad.title.value.trim();
    const subject = formularioActividad.subject.value.trim();
    const type = formularioActividad.type.value;
    const estimatedTimeValue = formularioActividad.estimatedTime.value;
    const deadline = formularioActividad.deadline.value;
    const notes = formularioActividad.notes.value.trim();
    const isImportant = formularioActividad.isImportant.checked;
    
    const priority = formularioActividad.querySelector('input[name="priority"]:checked').value;
    
    //validaciones simples
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

    //creo el objeto
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

//-- eventos en la tabla (delegacion) --

function manejarInteraccionesTabla(e){
    const target = e.target;
    const fila = target.closest('tr');
    if(!fila) return;

    const idActividad = parseInt(fila.dataset.id);
    const indice = actividades.findIndex(a => a.id === idActividad);
    
    if(indice === -1) return; 
    const actividad = actividades[indice];

    //boton eliminar
    if(target.classList.contains('btn-delete')){
        console.warn(`[Planificador] eliminando actividad: ${idActividad}`); 
        
        actividades.splice(indice, 1);
        guardarActividades();
        renderizarTablaActividades();
        return;
    }

    //checkbox completar
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

    //boton editar
    if(target.classList.contains('btn-edit')){
        abrirModalEdicion(idActividad);
        return;
    }
}

//-- filtros y buscadores --

function manejarCambioFiltro(e){
    const target = e.target;
    const nuevoFiltro = target.dataset.filter;

    if(nuevoFiltro && nuevoFiltro !== filtroActual){
        filtroActual = nuevoFiltro;
        
        //cambio la clase activa de los botones
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

//-- modal de edicion --

function abrirModalEdicion(id){
    const actividad = actividades.find(a => a.id === id);
    if (!actividad) return;

    idActividadEditando = id;
    
    const editarTitulo = document.getElementById('editTitle');
    const editarMateria = document.getElementById('editSubject');
    const editarTipo = document.getElementById('editType');
    const editarFechaLimite = document.getElementById('editDeadline');
    const modalEdicion = document.getElementById('editModal');

    //relleno el form del modal con los datos actuales
    editarTitulo.value = actividad.title;
    editarMateria.value = actividad.subject;
    editarTipo.value = actividad.type;
    editarFechaLimite.value = actividad.deadline;

    modalEdicion.classList.add('is-open');
    modalEdicion.setAttribute('aria-hidden', 'false');
}

function cerrarModalEdicion(){
    const modalEdicion = document.getElementById('editModal');
    const formularioEdicion = document.getElementById('editForm');
    
    modalEdicion.classList.remove('is-open');
    modalEdicion.setAttribute('aria-hidden', 'true');
    idActividadEditando = null;
    formularioEdicion.reset();
}

function manejarGuardarEdicion(e){
    e.preventDefault();

    if(idActividadEditando === null) return;

    const actividad = actividades.find(a => a.id === idActividadEditando);
    if(!actividad) return;

    const editarTitulo = document.getElementById('editTitle');
    const editarMateria = document.getElementById('editSubject');
    const editarTipo = document.getElementById('editType');
    const editarFechaLimite = document.getElementById('editDeadline');

    //actualizo el objeto
    actividad.title = editarTitulo.value.trim();
    actividad.subject = editarMateria.value.trim();
    actividad.type = editarTipo.value;
    actividad.deadline = editarFechaLimite.value;

    guardarActividades();
    cerrarModalEdicion();
    renderizarTablaActividades();
}

//-- tema claro/oscuro --

function manejarAlternarTema(){
    const body = document.body;
    
    const esClaroAhora = body.classList.toggle('theme-light');
    
    localStorage.setItem('themePreference', esClaroAhora ? 'light' : 'dark');
}

function inicializarTema() {
    const temaGuardado = localStorage.getItem('themePreference');
    const body = document.body;
    if(temaGuardado === 'light') {
        body.classList.add('theme-light');
    } 
}

// pequeño FIX: esta funcion la agregue porque el CSS original me traia problemas con el modo claro
//y no se veian las letras. Agrega estilos extras al <head>
function inyectarEstilosCorreccionTema() {
    const estilo = document.createElement('style');
    estilo.textContent = `
        body.theme-light {
            background-image: none !important;
            background-color: var(--bg) !important;
        }
        
        body.theme-light .panel,
        body.theme-light .header,
        body.theme-light .stat-card,
        body.theme-light .toolbar,
        body.theme-light .modal__content,
        body.theme-light input,
        body.theme-light select,
        body.theme-light textarea {
            background: var(--bg-soft) !important;
            color: var(--fg) !important;
            border-color: var(--border) !important;
        }

        body.theme-light .table-wrapper,
        body.theme-light thead {
            background: var(--bg-soft) !important;
            color: var(--fg) !important;
            border-color: var(--border) !important;
        }

        body.theme-light tbody tr:nth-child(even) {
            background: var(--bg-softer) !important;
        }
        body.theme-light tbody tr:hover {
            background: #ffffff !important;
        }
        body.theme-light th, 
        body.theme-light td {
            border-bottom-color: var(--border) !important;
        }
        
        body.theme-light .chip {
            background: #e5e7eb !important;
            border-color: #d1d5db !important;
        }
    `;
    document.head.appendChild(estilo);
}

//-- inicio de la aplicacion --

function iniciarApp(){
    cargarActividades();
    inicializarTema();
    
    inyectarEstilosCorreccionTema();
    
    renderizarTablaActividades();

    //referencias al DOM
    const formularioActividad = document.getElementById('activityForm');
    const cuerpoTablaActividades = document.getElementById('activityTableBody');
    const botonesFiltro = document.querySelectorAll('.btn-filter');
    const campoBusqueda = document.getElementById('search');
    const selectorOrdenar = document.getElementById('sort');
    const formularioEdicion = document.getElementById('editForm');
    const botonCerrarModal = document.getElementById('btnCloseModal');
    const botonCancelarEdicion = document.getElementById('btnCancelEdit');
    const botonAlternarTema = document.getElementById('btnToggleTheme');
    const modalEdicion = document.getElementById('editModal');

    //event listeners
    formularioActividad.addEventListener('submit', manejarAgregarActividad);
    cuerpoTablaActividades.addEventListener('click', manejarInteraccionesTabla);
    cuerpoTablaActividades.addEventListener('change', manejarInteraccionesTabla); 

    botonesFiltro.forEach(btn => {
        btn.addEventListener('click', manejarCambioFiltro);
    });
    campoBusqueda.addEventListener('input', manejarInputBusqueda);
    selectorOrdenar.addEventListener('change', manejarCambioOrden);

    formularioEdicion.addEventListener('submit', manejarGuardarEdicion);
    botonCerrarModal.addEventListener('click', cerrarModalEdicion);
    botonCancelarEdicion.addEventListener('click', cerrarModalEdicion);
    
    modalEdicion.addEventListener('click', (e) => {
        if(e.target.classList.contains('modal__backdrop')){
            cerrarModalEdicion();
        }
    });
    
    botonAlternarTema.addEventListener('click', manejarAlternarTema);
}

iniciarApp();