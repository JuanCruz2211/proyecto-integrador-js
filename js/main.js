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