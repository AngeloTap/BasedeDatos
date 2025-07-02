//Para almacenar todos los alumnos
let alumnosRegistrados = [];
// Objeto para almacenar los grupos. La clave será el nombre del grupo y el valor un array de IDs de alumnos.
let grupos = {};

/**
 * Clase que representa a un alumno en el sistema.
 */
class Alumno {
    /**
     * Constructor de la clase Alumno.
     * @param {string} nombre - El nombre del alumno.
     * @param {string} apellidos - Los apellidos del alumno.
     * @param {number} edad - La edad del alumno.
     */
    constructor(nombre, apellidos, edad) {
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.edad = edad;
        this.id_alumno = this.generarIdAlumno(); // Genera un ID único para cada alumno
        this.materias_inscritas = []; // Array de strings con los nombres de las materias
        this.calificaciones = {}; // Objeto donde la clave es la materia y el valor es la calificación
    }

    generarIdAlumno() {
        return 'ALU-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }

    inscribirMateria(nombreMateria) {
        if (!this.materias_inscritas.includes(nombreMateria)) {
            this.materias_inscritas.push(nombreMateria);
            this.calificaciones[nombreMateria] = null; 
            return true;
        }
        return false; 
    }

    asignarCalificacion(nombreMateria, calificacion) {
        if (this.materias_inscritas.includes(nombreMateria)) {
            if (calificacion >= 0 && calificacion <= 100) {
                this.calificaciones[nombreMateria] = calificacion;
                return true;
            } else {
                mostrarMensaje('La calificación debe estar entre 0 y 100.', 'error');
                return false;
            }
        }
        mostrarMensaje(`El alumno no está inscrito en la materia: ${nombreMateria}`, 'error');
        return false;
    }

    obtenerPromedio() {
        let totalCalificaciones = 0;
        let materiasConCalificacion = 0;
        for (const materia in this.calificaciones) {
            const calificacion = this.calificaciones[materia];
            if (calificacion !== null && !isNaN(calificacion)) {
                totalCalificaciones += calificacion;
                materiasConCalificacion++;
            }
        }
        return materiasConCalificacion > 0 ? (totalCalificaciones / materiasConCalificacion).toFixed(2) : 0;
    }
}

// localStorage

function guardarDatos() {
    try {
        localStorage.setItem('alumnosRegistrados', JSON.stringify(alumnosRegistrados));
        localStorage.setItem('grupos', JSON.stringify(grupos));
        // No mostrar mensaje de éxito aquí para evitar spam en cada guardado
    } catch (e) {
        mostrarMensaje('Error al guardar datos en localStorage: ' + e.message, 'error');
    }
}

function cargarDatos() {
    try {
        const storedAlumnos = localStorage.getItem('alumnosRegistrados');
        const storedGrupos = localStorage.getItem('grupos');

        if (storedAlumnos) {
            const parsedAlumnos = JSON.parse(storedAlumnos);
            // Recrear instancias de Alumno para que tengan los métodos de la clase
            alumnosRegistrados = parsedAlumnos.map(data => {
                const alumno = new Alumno(data.nombre, data.apellidos, data.edad);
                alumno.id_alumno = data.id_alumno; // Asegurar que el ID se mantenga
                alumno.materias_inscritas = data.materias_inscritas;
                alumno.calificaciones = data.calificaciones;
                return alumno;
            });
        }

        if (storedGrupos) {
            grupos = JSON.parse(storedGrupos);
        }
        mostrarMensaje('Datos cargados exitosamente.', 'success');
    } catch (e) {
        mostrarMensaje('Error al cargar datos desde localStorage: ' + e.message, 'error');
    }
}

// Funciones de Control de Secciones 
const sectionIds = [
    'section-alta-alumno',
    'section-materias-calificaciones',
    'section-grupos',
    'section-consultas'
];

function showSection(sectionIdToShow) {
    sectionIds.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none'; // Oculta todas las secciones
        }
    });

    const targetSection = document.getElementById(sectionIdToShow);
    if (targetSection) {
        targetSection.style.display = 'block'; // Muestra la sección deseada
    }
    actualizarSelectAlumnos();
    actualizarSelectGrupos();
    mostrarListaAlumnos();
    mostrarListaGrupos();
}


// Funciones de Utilidad para la UI

function mostrarMensaje(mensaje, tipo = 'success') {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = mensaje;
    messageBox.className = 'message-box'; // Resetear clases
    messageBox.classList.add(tipo);
    messageBox.style.display = 'block';
    void messageBox.offsetWidth;
    messageBox.style.opacity = 1;

    setTimeout(() => {
        messageBox.style.opacity = 0;
        messageBox.addEventListener('transitionend', function handler() {
            messageBox.style.display = 'none';
            messageBox.removeEventListener('transitionend', handler);
        }, { once: true });
    }, 3000); // El mensaje desaparece después de 3 segundos
}

function actualizarSelectAlumnos() {
    const selects = [
        document.getElementById('select-alumno-inscribir'),
        document.getElementById('select-alumno-calificar'),
        document.getElementById('select-alumno-grupo'),
        document.getElementById('select-alumno-promedio')
    ];

    selects.forEach(select => {
        // Guardar el valor seleccionado antes de limpiar
        const selectedValue = select.value;
        select.innerHTML = '<option value="">-- Seleccione un alumno --</option>'; // Limpiar opciones
        alumnosRegistrados.forEach(alumno => {
            const option = document.createElement('option');
            option.value = alumno.id_alumno;
            option.textContent = `${alumno.nombre} ${alumno.apellidos} (ID: ${alumno.id_alumno})`;
            select.appendChild(option);
        });
        // Restaurar el valor seleccionado si aún existe
        if ([...select.options].some(option => option.value === selectedValue)) {
            select.value = selectedValue;
        }
        // Si el select de calificar es el que se actualiza, también actualizar sus materias
        if (select.id === 'select-alumno-calificar' && select.value) {
            actualizarSelectMaterias(select.value);
        }
    });
}

function actualizarSelectMaterias(alumnoId) {
    const selectMateriaCalificar = document.getElementById('select-materia-calificar');
    // Guardar el valor seleccionado antes de limpiar
    const selectedValue = selectMateriaCalificar.value;
    selectMateriaCalificar.innerHTML = '<option value="">-- Seleccione una materia --</option>';

    const alumno = alumnosRegistrados.find(a => a.id_alumno === alumnoId);
    if (alumno) {
        alumno.materias_inscritas.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia;
            option.textContent = materia;
            selectMateriaCalificar.appendChild(option);
        });
    }
    if ([...selectMateriaCalificar.options].some(option => option.value === selectedValue)) {
        selectMateriaCalificar.value = selectedValue;
    }
}

function actualizarSelectGrupos() {
    const selects = [
        document.getElementById('select-grupo-asignar'),
        document.getElementById('select-grupo-promedio')
    ];

    selects.forEach(select => {
        // Guardar el valor seleccionado antes de limpiar
        const selectedValue = select.value;
        select.innerHTML = '<option value="">-- Seleccione un grupo --</option>'; // Limpiar opciones
        for (const grupoNombre in grupos) {
            const option = document.createElement('option');
            option.value = grupoNombre;
            option.textContent = grupoNombre;
            select.appendChild(option);
        }
        // Restaurar el valor seleccionado si aún existe
        if ([...select.options].some(option => option.value === selectedValue)) {
            select.value = selectedValue;
        }
    });
}


function mostrarListaAlumnos(alumnosAMostrar = alumnosRegistrados, titulo = 'Lista de Alumnos') {
    const listaAlumnosDiv = document.getElementById('lista-alumnos');
    listaAlumnosDiv.innerHTML = `<h3>${titulo}</h3>`;

    if (alumnosAMostrar.length === 0) {
        listaAlumnosDiv.innerHTML += '<p>No hay alumnos registrados para mostrar.</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Edad</th>
                <th>Materias Inscritas</th>
                <th>Calificaciones</th>
                <th>Promedio</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    const tbody = table.querySelector('tbody');

    alumnosAMostrar.forEach(alumno => {
        const row = tbody.insertRow();
        row.insertCell().textContent = alumno.id_alumno;
        row.insertCell().textContent = `${alumno.nombre} ${alumno.apellidos}`;
        row.insertCell().textContent = alumno.edad;
        row.insertCell().textContent = alumno.materias_inscritas.join(', ') || 'Ninguna';

        // Formatear calificaciones
        const calificacionesTexto = Object.entries(alumno.calificaciones)
            .map(([materia, calificacion]) => `${materia}: ${calificacion !== null ? calificacion : 'N/A'}`)
            .join('; ') || 'Ninguna';
        row.insertCell().textContent = calificacionesTexto;
        row.insertCell().textContent = alumno.obtenerPromedio();
    });

    listaAlumnosDiv.appendChild(table);
}

function mostrarListaGrupos() {
    const listaGruposDiv = document.getElementById('lista-grupos');
    listaGruposDiv.innerHTML = '<h3>Lista de Grupos</h3>';

    if (Object.keys(grupos).length === 0) {
        listaGruposDiv.innerHTML += '<p>No hay grupos creados.</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nombre del Grupo</th>
                <th>Alumnos (ID - Nombre)</th>
                <th>Promedio del Grupo</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    const tbody = table.querySelector('tbody');

    for (const grupoNombre in grupos) {
        const row = tbody.insertRow();
        row.insertCell().textContent = grupoNombre;

        const alumnosEnGrupoIds = grupos[grupoNombre];
        const alumnosDetalle = alumnosEnGrupoIds.map(alumnoId => {
            const alumno = alumnosRegistrados.find(a => a.id_alumno === alumnoId);
            return alumno ? `${alumno.id_alumno} - ${alumno.nombre} ${alumno.apellidos}` : `ID Desconocido: ${alumnoId}`;
        }).join('<br>'); // Usar <br> para saltos de línea en la celda
        row.insertCell().innerHTML = alumnosDetalle || 'Ninguno';

        const promedioGrupo = obtenerPromedioGrupo(grupoNombre);
        row.insertCell().textContent = promedioGrupo !== null ? promedioGrupo : 'N/A';
    }
    listaGruposDiv.appendChild(table);
}


// --- Funciones de Gestión de Alumnos ---

function darDeAltaAlumno() {
    const nombre = document.getElementById('nombre-alumno').value.trim();
    const apellidos = document.getElementById('apellidos-alumno').value.trim();
    const edad = parseInt(document.getElementById('edad-alumno').value);

    if (!nombre || !apellidos || isNaN(edad) || edad <= 0) {
        mostrarMensaje('Por favor, complete todos los campos para dar de alta al alumno.', 'error');
        return;
    }

    const nuevoAlumno = new Alumno(nombre, apellidos, edad);
    alumnosRegistrados.push(nuevoAlumno);
    guardarDatos();
    mostrarMensaje(`Alumno ${nombre} ${apellidos} dado de alta con ID: ${nuevoAlumno.id_alumno}`, 'success');
    document.getElementById('form-alta-alumno').reset(); // Limpiar formulario
    actualizarSelectAlumnos(); // Actualizar selectores
    mostrarListaAlumnos(); // Refrescar lista
}

function inscribirAlumnoAMateria() {
    const alumnoId = document.getElementById('select-alumno-inscribir').value;
    const nombreMateria = document.getElementById('nombre-materia-inscribir').value.trim();

    if (!alumnoId || !nombreMateria) {
        mostrarMensaje('Por favor, seleccione un alumno y escriba el nombre de la materia.', 'error');
        return;
    }

    const alumno = alumnosRegistrados.find(a => a.id_alumno === alumnoId);
    if (alumno) {
        if (alumno.inscribirMateria(nombreMateria)) {
            guardarDatos();
            mostrarMensaje(`Alumno ${alumno.nombre} inscrito en ${nombreMateria}.`, 'success');
            document.getElementById('nombre-materia-inscribir').value = ''; // Limpiar campo
            mostrarListaAlumnos(); // Refrescar lista
            actualizarSelectMaterias(alumnoId); // Actualizar materias disponibles para calificar
        } else {
            mostrarMensaje(`El alumno ${alumno.nombre} ya está inscrito en ${nombreMateria}.`, 'error');
        }
    } else {
        mostrarMensaje('Alumno no encontrado.', 'error');
    }
}

function asignarCalificacion() {
    const alumnoId = document.getElementById('select-alumno-calificar').value;
    const nombreMateria = document.getElementById('select-materia-calificar').value;
    const calificacion = parseFloat(document.getElementById('calificacion-materia').value);

    if (!alumnoId || !nombreMateria || isNaN(calificacion)) {
        mostrarMensaje('Por favor, seleccione un alumno y materia, y escriba una calificación válida.', 'error');
        return;
    }

    const alumno = alumnosRegistrados.find(a => a.id_alumno === alumnoId);
    if (alumno) {
        if (alumno.asignarCalificacion(nombreMateria, calificacion)) {
            guardarDatos();
            mostrarMensaje(`Calificación ${calificacion} asignada a ${alumno.nombre} en ${nombreMateria}.`, 'success');
            document.getElementById('calificacion-materia').value = ''; // Limpiar campo
            mostrarListaAlumnos(); // Refrescar lista
        }
    } else {
        mostrarMensaje('Alumno no encontrado.', 'error');
    }
}

function crearGrupo() {
    const nombreGrupo = document.getElementById('nombre-grupo').value.trim();

    if (!nombreGrupo) {
        mostrarMensaje('Por favor, ingrese un nombre para el grupo.', 'error');
        return;
    }
    if (grupos[nombreGrupo]) {
        mostrarMensaje(`El grupo "${nombreGrupo}" ya existe.`, 'error');
        return;
    }

    grupos[nombreGrupo] = []; // Inicializar el grupo como un array vacío de IDs de alumnos
    guardarDatos();
    mostrarMensaje(`Grupo "${nombreGrupo}" creado exitosamente.`, 'success');
    document.getElementById('nombre-grupo').value = ''; // Limpiar campo
    actualizarSelectGrupos(); // Actualizar selectores de grupos
    mostrarListaGrupos(); // Refrescar lista de grupos
}

function asignarAlumnoAGrupo() {
    const alumnoId = document.getElementById('select-alumno-grupo').value;
    const nombreGrupo = document.getElementById('select-grupo-asignar').value;

    if (!alumnoId || !nombreGrupo) {
        mostrarMensaje('Por favor, seleccione un alumno y un grupo.', 'error');
        return;
    }

    const alumno = alumnosRegistrados.find(a => a.id_alumno === alumnoId);
    if (!alumno) {
        mostrarMensaje('Alumno no encontrado.', 'error');
        return;
    }

    if (!grupos[nombreGrupo]) {
        mostrarMensaje('El grupo seleccionado no existe.', 'error');
        return;
    }

    if (grupos[nombreGrupo].includes(alumnoId)) {
        mostrarMensaje(`El alumno ${alumno.nombre} ya está en el grupo "${nombreGrupo}".`, 'error');
        return;
    }

    grupos[nombreGrupo].push(alumnoId);
    guardarDatos();
    mostrarMensaje(`Alumno ${alumno.nombre} asignado al grupo "${nombreGrupo}".`, 'success');
    mostrarListaGrupos(); // Refrescar lista de grupos
}

// Funciones de Búsqueda y Reportes

function buscarAlumnoPorNombre() {
    const nombreBusqueda = document.getElementById('input-buscar-nombre').value.trim().toLowerCase();
    const resultadoBusquedaDiv = document.getElementById('resultado-busqueda');
    resultadoBusquedaDiv.innerHTML = ''; // Limpiar resultados anteriores

    if (!nombreBusqueda) {
        mostrarMensaje('Por favor, ingrese un nombre para buscar.', 'error');
        return;
    }

    const resultados = alumnosRegistrados.filter(alumno =>
        alumno.nombre.toLowerCase().includes(nombreBusqueda)
    );

    if (resultados.length > 0) {
        mostrarListaAlumnos(resultados, `Resultados de búsqueda por nombre: "${nombreBusqueda}"`);
    } else {
        resultadoBusquedaDiv.innerHTML = `<p>No se encontraron alumnos con el nombre "${nombreBusqueda}".</p>`;
    }
}

function buscarAlumnoPorApellido() {
    const apellidoBusqueda = document.getElementById('input-buscar-apellido').value.trim().toLowerCase();
    const resultadoBusquedaDiv = document.getElementById('resultado-busqueda');
    resultadoBusquedaDiv.innerHTML = ''; // Limpiar resultados anteriores

    if (!apellidoBusqueda) {
        mostrarMensaje('Por favor, ingrese un apellido para buscar.', 'error');
        return;
    }

    const resultados = alumnosRegistrados.filter(alumno =>
        alumno.apellidos.toLowerCase().includes(apellidoBusqueda)
    );

    if (resultados.length > 0) {
        mostrarListaAlumnos(resultados, `Resultados de búsqueda por apellido: "${apellidoBusqueda}"`);
    } else {
        resultadoBusquedaDiv.innerHTML = `<p>No se encontraron alumnos con el apellido "${apellidoBusqueda}".</p>`;
    }
}

function obtenerPromedioAlumno() {
    const alumnoId = document.getElementById('select-alumno-promedio').value;
    const resultadoPromedioDiv = document.getElementById('resultado-promedio-alumno');
    resultadoPromedioDiv.innerHTML = '';

    if (!alumnoId) {
        mostrarMensaje('Por favor, seleccione un alumno para obtener su promedio.', 'error');
        return;
    }

    const alumno = alumnosRegistrados.find(a => a.id_alumno === alumnoId);
    if (alumno) {
        const promedio = alumno.obtenerPromedio();
        resultadoPromedioDiv.innerHTML = `<p>El promedio de ${alumno.nombre} ${alumno.apellidos} es: <strong>${promedio}</strong></p>`;
    } else {
        mostrarMensaje('Alumno no encontrado.', 'error');
    }
}

function obtenerPromedioGrupo(nombreGrupo) {
    if (!grupos[nombreGrupo]) {
        return null;
    }

    const alumnosIdsEnGrupo = grupos[nombreGrupo];
    let totalCalificacionesGrupo = 0;
    let totalMateriasConCalificacionGrupo = 0;

    alumnosIdsEnGrupo.forEach(alumnoId => {
        const alumno = alumnosRegistrados.find(a => a.id_alumno === alumnoId);
        if (alumno) {
            for (const materia in alumno.calificaciones) {
                const calificacion = alumno.calificaciones[materia];
                if (calificacion !== null && !isNaN(calificacion)) {
                    totalCalificacionesGrupo += calificacion;
                    totalMateriasConCalificacionGrupo++;
                }
            }
        }
    });

    return totalMateriasConCalificacionGrupo > 0 ? (totalCalificacionesGrupo / totalMateriasConCalificacionGrupo).toFixed(2) : 0;
}

function mostrarPromedioGrupo() {
    const nombreGrupo = document.getElementById('select-grupo-promedio').value;
    const resultadoPromedioGrupoDiv = document.getElementById('resultado-promedio-grupo');
    resultadoPromedioGrupoDiv.innerHTML = '';

    if (!nombreGrupo) {
        mostrarMensaje('Por favor, seleccione un grupo para obtener su promedio.', 'error');
        return;
    }

    const promedio = obtenerPromedioGrupo(nombreGrupo);
    if (promedio !== null) {
        resultadoPromedioGrupoDiv.innerHTML = `<p>El promedio del grupo "${nombreGrupo}" es: <strong>${promedio}</strong></p>`;
    } else {
        mostrarMensaje('Grupo no encontrado o sin alumnos/calificaciones.', 'error');
    }
}


function obtenerAlumnosOrdenadosPorCalificacion(orden) {
    const alumnosOrdenados = [...alumnosRegistrados].sort((a, b) => {
        const promedioA = parseFloat(a.obtenerPromedio());
        const promedioB = parseFloat(b.obtenerPromedio());

        if (orden === 'asc') {
            return promedioA - promedioB;
        } else {
            return promedioB - promedioA;
        }
    });
    mostrarListaAlumnos(alumnosOrdenados, `Lista de Alumnos ordenada por Calificación (${orden === 'asc' ? 'Ascendente' : 'Descendente'})`);
}


function buscarAlumnoPorId() {
    const idBusqueda = document.getElementById('input-buscar-id').value.trim();
    const resultadoBusquedaDiv = document.getElementById('resultado-busqueda');
    resultadoBusquedaDiv.innerHTML = ''; // Limpiar resultados anteriores

    if (!idBusqueda) {
        mostrarMensaje('Por favor, ingrese un ID para buscar.', 'error');
        return;
    }

    const alumnoEncontrado = alumnosRegistrados.find(alumno => alumno.id_alumno === idBusqueda);

    if (alumnoEncontrado) {
        mostrarListaAlumnos([alumnoEncontrado], `Resultado de búsqueda por ID: "${idBusqueda}"`);
    } else {
        resultadoBusquedaDiv.innerHTML = `<p>No se encontró ningún alumno con el ID "${idBusqueda}".</p>`;
    }
}

function ordenarAlumnosPorEdad(orden) {
    const alumnosOrdenados = [...alumnosRegistrados].sort((a, b) => {
        if (orden === 'asc') {
            return a.edad - b.edad;
        } else {
            return b.edad - a.edad;
        }
    });
    mostrarListaAlumnos(alumnosOrdenados, `Lista de Alumnos ordenada por Edad (${orden === 'asc' ? 'Ascendente' : 'Descendente'})`);
}


//Cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos(); // Cargar datos al iniciar la página
    showSection('section-alta-alumno'); // Asegurarse de que solo la primera sección sea visible al inicio

    // Event Listeners para formularios y botones
    document.getElementById('form-alta-alumno').addEventListener('submit', (e) => {
        e.preventDefault(); // Evitar que la página se recargue
        darDeAltaAlumno();
    });

    document.getElementById('btn-inscribir-materia').addEventListener('click', inscribirAlumnoAMateria);
    document.getElementById('btn-asignar-calificacion').addEventListener('click', asignarCalificacion);
    document.getElementById('btn-crear-grupo').addEventListener('click', crearGrupo);
    document.getElementById('btn-asignar-alumno-grupo').addEventListener('click', asignarAlumnoAGrupo);

    document.getElementById('btn-buscar-nombre').addEventListener('click', buscarAlumnoPorNombre);
    document.getElementById('btn-buscar-apellido').addEventListener('click', buscarAlumnoPorApellido);
    document.getElementById('btn-buscar-id').addEventListener('click', buscarAlumnoPorId); // Punto extra

    document.getElementById('btn-obtener-promedio-alumno').addEventListener('click', obtenerPromedioAlumno);
    document.getElementById('btn-obtener-promedio-grupo').addEventListener('click', mostrarPromedioGrupo);

    document.getElementById('btn-mostrar-todos-alumnos').addEventListener('click', () => mostrarListaAlumnos());
    document.getElementById('btn-ordenar-calificacion-asc').addEventListener('click', () => obtenerAlumnosOrdenadosPorCalificacion('asc'));
    document.getElementById('btn-ordenar-calificacion-desc').addEventListener('click', () => obtenerAlumnosOrdenadosPorCalificacion('desc'));
    document.getElementById('btn-ordenar-edad-asc').addEventListener('click', () => ordenarAlumnosPorEdad('asc')); // Punto extra
    document.getElementById('btn-ordenar-edad-desc').addEventListener('click', () => ordenarAlumnosPorEdad('desc')); // Punto extra

    document.getElementById('select-alumno-calificar').addEventListener('change', (e) => {
        actualizarSelectMaterias(e.target.value);
    });

    document.querySelectorAll('.next-step-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const nextSectionId = e.target.dataset.nextSection;
            if (nextSectionId) {
                showSection(nextSectionId);
            }
        });
    });

    document.querySelectorAll('.prev-step-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const prevSectionId = e.target.dataset.prevSection;
            if (prevSectionId) {
                showSection(prevSectionId);
            }
        });
    });

    document.querySelectorAll('.back-to-start-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const startSectionId = e.target.dataset.startSection;
            if (startSectionId) {
                showSection(startSectionId);
            }
        });
    });
});
