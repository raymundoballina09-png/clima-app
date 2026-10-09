
 // ============================================
 // CONFIGURACION
 // ============================================

const API_KEY = 'a51fb38faed7e807106b1947be8067e8';

const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

const formulario = document.getElementById('formulario');
const inputCiudad = document.getElementById('inputCiudad');
const resultado = document.getElementById('resultado');
const estado = document.getElementById('estado');

// ============================================
// CONSULTAR CLIMA
// ============================================

async function consultarClima(ciudad) {

    estado.textContent = '🔄 Consultando el clima...';
    resultado.classList.remove('visible');

    try {

        const ciudadCodificada = encodeURIComponent(ciudad);

        const url = API_URL + '?q=' + ciudadCodificada +
            '&appid=' + API_KEY + '&units=metric&lang=es';

        const respuesta = await fetch(url);

        if (!respuesta.ok) {

            if (respuesta.status === 404) {
                throw new Error('Ciudad no encontrada');
            } else if (respuesta.status === 401) {
                throw new Error('API Key invalida');
            } else {
                throw new Error('Error en la peticion: ' + respuesta.status);
            }
        }

        const datos = await respuesta.json();

        mostrarClima(datos);

        // GUARDAR CIUDAD EN EL HISTORIAL
        guardarHistorial(datos.name);

        estado.textContent = '✅ Datos actualizados correctamente.';

    } catch (error) {

        console.error('Error:', error);

        estado.textContent = '❌ ' + error.message +
            '. Intenta con otra ciudad.';

        resultado.classList.remove('visible');
    }
}

// ============================================
// MOSTRAR CLIMA
// ============================================

function mostrarClima(datos) {

    const ciudad = datos.name;
    const pais = datos.sys.country;
    const temperatura = Math.round(datos.main.temp);
    const sensacion = Math.round(datos.main.feels_like);
    const humedad = datos.main.humidity;
    const presion = datos.main.pressure;
    const viento = datos.wind.speed;
    const descripcion = datos.weather[0].description;
    const icono = datos.weather[0].icon;

    const iconoUrl =
        'https://openweathermap.org/img/wn/' + icono + '@2x.png';

    resultado.innerHTML = `
        <div class="ciudad">${ciudad}</div>
        <div class="pais">${pais}</div>
        <img src="${iconoUrl}" alt="${descripcion}" class="icono-clima">
        <div class="temperatura">${temperatura}°C</div>
        <div class="descripcion">${descripcion}</div>

        <div class="detalles">

            <div class="detalle">
                <div class="etiqueta">Sensación</div>
                <div class="valor">${sensacion}°C</div>
            </div>

            <div class="detalle">
                <div class="etiqueta">Humedad</div>
                <div class="valor">${humedad}%</div>
            </div>

            <div class="detalle">
                <div class="etiqueta">Presión</div>
                <div class="valor">${presion} hPa</div>
            </div>

            <div class="detalle">
                <div class="etiqueta">Viento</div>
                <div class="valor">${viento} m/s</div>
            </div>

        </div>
    `;

    resultado.classList.add('visible');

    cambiarFondoSegunClima(datos.weather[0].main);
}

// ============================================
// CAMBIAR FONDO SEGUN EL CLIMA
// ============================================

function cambiarFondoSegunClima(clima) {

    document.body.classList.remove(
        'clima-soleado',
        'clima-nublado',
        'clima-lluvioso',
        'clima-nieve'
    );

    const climaLower = clima.toLowerCase();

    if (climaLower.includes('clear')) {

        document.body.classList.add('clima-soleado');

    } else if (climaLower.includes('cloud')) {

        document.body.classList.add('clima-nublado');

    } else if (
        climaLower.includes('rain') ||
        climaLower.includes('drizzle') ||
        climaLower.includes('thunderstorm')
    ) {

        document.body.classList.add('clima-lluvioso');

    } else if (climaLower.includes('snow')) {

        document.body.classList.add('clima-nieve');
    }
}

// ============================================
// HISTORIAL DE LAS ULTIMAS 5 CIUDADES
// ============================================

function guardarHistorial(ciudad) {

    let historial = JSON.parse(
        localStorage.getItem('historial')
    ) || [];

    historial = historial.filter(function(nombre) {
        return nombre.toLowerCase() !== ciudad.toLowerCase();
    });

    historial.push(ciudad);

    historial = historial.slice(-5);

    localStorage.setItem(
        'historial',
        JSON.stringify(historial)
    );

    mostrarHistorial();
}

function mostrarHistorial() {

    const contenedor = document.getElementById('historial');

    if (!contenedor) {
        return;
    }

    let historial = JSON.parse(
        localStorage.getItem('historial')
    ) || [];

    contenedor.innerHTML = '';

    historial.forEach(function(ciudad) {

        const boton = document.createElement('button');

        boton.textContent = ciudad;

        boton.type = 'button';

        boton.onclick = function() {
            inputCiudad.value = ciudad;
            consultarClima(ciudad);
        };

        contenedor.appendChild(boton);
    });
}

// ============================================
// PRONOSTICO DE 5 DIAS
// ============================================

async function pronostico() {

    const ciudad = inputCiudad.value.trim();

    if (!ciudad) {
        estado.textContent = 'Escribe una ciudad primero.';
        return;
    }

    try {

        const url = 'https://api.openweathermap.org/data/2.5/forecast?q=' +
            encodeURIComponent(ciudad) +
            '&appid=' + API_KEY +
            '&units=metric&lang=es';

        const respuesta = await fetch(url);
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener el pronostico.');
        }

        let texto = '<h2>Pronostico de 5 dias</h2>';

        for (let i = 0; i < datos.list.length; i += 8) {

            texto += '<p>' +
                datos.list[i].dt_txt + ' - ' +
                datos.list[i].main.temp + '°C - ' +
                datos.list[i].weather[0].description +
                '</p>';
        }

        document.getElementById('pronostico').innerHTML = texto;

    } catch (error) {

        estado.textContent = error.message;
    }
}

// ============================================
// GEOLOCALIZACION
// ============================================

function obtenerUbicacion() {

    if (!navigator.geolocation) {
        estado.textContent = 'Tu navegador no permite geolocalizacion.';
        return;
    }

    navigator.geolocation.getCurrentPosition(async function(posicion) {

        try {

            const lat = posicion.coords.latitude;
            const lon = posicion.coords.longitude;

            const url = API_URL + '?lat=' + lat +
                '&lon=' + lon +
                '&appid=' + API_KEY +
                '&units=metric&lang=es';

            const respuesta = await fetch(url);
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error('No se pudo consultar tu ubicacion.');
            }

            mostrarClima(datos);
            guardarHistorial(datos.name);

            estado.textContent = '✅ Clima de tu ubicacion actualizado.';

        } catch (error) {

            estado.textContent = '❌ ' + error.message;
        }

    }, function() {

        estado.textContent =
            'No se pudo obtener tu ubicacion. Revisa los permisos del navegador.';
    });
}

// ============================================
// MODO CLARO Y OSCURO
// ============================================


function cambiarTema() {
    document.body.classList.toggle('claro');
}
}

// ============================================
// COMPARTIR EN WHATSAPP
// ============================================

function compartirWhatsApp() {

    const ciudad = resultado.querySelector('.ciudad');
    const temperatura = resultado.querySelector('.temperatura');
    const descripcion = resultado.querySelector('.descripcion');

    if (!ciudad || !temperatura) {
        estado.textContent = 'Primero consulta el clima de una ciudad.';
        return;
    }

    const mensaje = 'El clima en ' + ciudad.textContent +
        ' es de ' + temperatura.textContent +
        '. Estado: ' + descripcion.textContent;

    const url = 'https://wa.me/?text=' + encodeURIComponent(mensaje);

    window.open(url, '_blank');
}

// ============================================
// FORMULARIO DE BUSQUEDA
// ============================================

formulario.addEventListener('submit', function(e) {

    e.preventDefault();

    const ciudad = inputCiudad.value.trim();

    if (!ciudad) {
        estado.textContent = 'Escribe el nombre de una ciudad.';
        return;
    }

    consultarClima(ciudad);
});

// ============================================
// INICIAR PAGINA
// ============================================

estado.textContent = 'Escribe una ciudad y presiona "Consultar".';

mostrarHistorial();
