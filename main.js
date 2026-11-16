//* Interacciones del sitio (sin dependencias). */

// 1) Actividades: al elegir una tarjeta se resalta y se actualiza el afiche.
const tarjetasActividad = document.querySelectorAll('.tarjeta-actividad');
const afiche = document.getElementById('afiche');
const aficheImagen = document.getElementById('afiche-imagen');
const aficheTituloEl = document.getElementById('afiche-titulo');

// En mobile/tablet el afiche viaja dentro de la tarjeta seleccionada;
// en desktop vuelve a su columna al costado del listado.
const vistaCompacta = window.matchMedia('(max-width: 63.99em)');
const contenedorActividades = afiche.parentElement;

function ubicarAfiche() {
  const seleccionada = document.querySelector('.tarjeta-actividad--destacada');
  const destino = vistaCompacta.matches && seleccionada ? seleccionada : contenedorActividades;

  // Solo se mueve si cambia de lugar. Hacer appendChild sobre el mismo padre saca el
  // afiche del documento y lo vuelve a insertar, y eso puede cortar la carga de la
  // imagen que todavía se estaba descargando (se veía el texto alternativo).
  if (afiche.parentElement !== destino) destino.appendChild(afiche);
}

function seleccionarActividad(tarjeta, { mantenerPosicion = false } = {}) {
  const topAntes = tarjeta.getBoundingClientRect().top;

  tarjetasActividad.forEach((t) => {
    t.classList.remove('tarjeta-actividad--destacada');
    t.removeAttribute('aria-current');
  });
  tarjeta.classList.add('tarjeta-actividad--destacada');
  tarjeta.setAttribute('aria-current', 'true');

  const { aficheImg, aficheAlt, aficheTitulo } = tarjeta.dataset;
  const conImagen = Boolean(aficheImg);

  afiche.classList.toggle('grilla-actividades__destacado--sin-imagen', !conImagen);
  aficheImagen.hidden = !conImagen;
  aficheTituloEl.hidden = conImagen;
  aficheTituloEl.textContent = aficheTitulo;

  if (conImagen) {
    aficheImagen.src = aficheImg;
    aficheImagen.alt = aficheAlt || '';
  }

  ubicarAfiche();

  // Al elegir a mano, la tarjeta tocada se queda donde está: se compensa el
  // corrimiento que produce el afiche anterior al plegarse (sin animar el scroll).
  if (mantenerPosicion) {
    const desfase = tarjeta.getBoundingClientRect().top - topAntes;
    if (desfase) window.scrollBy({ top: desfase, behavior: 'instant' });
  }
}

vistaCompacta.addEventListener('change', ubicarAfiche);

// Al cargar la página se selecciona la actividad destacada del HTML: así el afiche se
// arma con el mismo camino que cuando se toca una tarjeta, y se ve desde el primer momento.
seleccionarActividad(document.querySelector('.tarjeta-actividad--destacada'));

// Rotación automática: pasa a la actividad siguiente cada INTERVALO_ROTACION.
const INTERVALO_ROTACION = 20000; // 20 segundos
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
let temporizador = null;

function indiceActual() {
  return [...tarjetasActividad].findIndex((t) => t.classList.contains('tarjeta-actividad--destacada'));
}

function iniciarRotacion() {
  detenerRotacion();
  if (sinMovimiento.matches) return;
  temporizador = setInterval(() => {
    const siguiente = tarjetasActividad[(indiceActual() + 1) % tarjetasActividad.length];
    seleccionarActividad(siguiente);
  }, INTERVALO_ROTACION);
}

function detenerRotacion() {
  clearInterval(temporizador);
  temporizador = null;
}

function elegirManual(tarjeta) {
  seleccionarActividad(tarjeta, { mantenerPosicion: true });
  iniciarRotacion(); // reinicia la cuenta de 20 s
}

tarjetasActividad.forEach((tarjeta) => {
  tarjeta.addEventListener('click', () => elegirManual(tarjeta));
  tarjeta.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      elegirManual(tarjeta);
    }
  });
});

// Solo se pausa si la pestaña no está visible o el usuario pidió reducir movimiento.
document.addEventListener('visibilitychange', () => (document.hidden ? detenerRotacion() : iniciarRotacion()));
sinMovimiento.addEventListener('change', iniciarRotacion);
iniciarRotacion();

// 2) Menú hamburguesa (mobile): abre/cierra, se cierra al elegir un enlace o con Escape.
const botonMenu = document.querySelector('.btn-hamburguesa');
const menu = document.getElementById('menu-principal');

function alternarMenu(abrir) {
  menu.classList.toggle('barra-navegacion--abierta', abrir);
  botonMenu.setAttribute('aria-expanded', String(abrir));
}

botonMenu.addEventListener('click', () => {
  alternarMenu(botonMenu.getAttribute('aria-expanded') !== 'true');
});

menu.addEventListener('click', (evento) => {
  if (evento.target.closest('a')) alternarMenu(false);
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') alternarMenu(false);
});

// 3) Formulario de voluntariado: validación nativa + mensaje de estado.
const formulario = document.getElementById('formulario-voluntariado');
const mensaje = document.getElementById('mensaje-formulario');
const confirmacion = document.getElementById('confirmacion-voluntariado');

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  mensaje.classList.remove('seccion-voluntariado__mensaje--error', 'seccion-voluntariado__mensaje--exito');

  if (!formulario.checkValidity()) {
    mensaje.classList.add('seccion-voluntariado__mensaje--error');
    mensaje.textContent = 'Completá todos los campos con datos válidos.';
    formulario.reportValidity();
    return;
  }

  // Todo bien: el formulario se oculta y en su lugar aparece el mensaje de confirmación.
  formulario.reset();
  formulario.hidden = true;
  confirmacion.hidden = false;
  confirmacion.focus(); // el foco pasa al mensaje para quien navega con teclado o lector de pantalla
});

// 4) Botón "volver arriba": aparece al bajar un poco y lleva al inicio de la página.
const botonSubir = document.querySelector('.btn-subir');
const DISTANCIA_APARICION = 400; // px de scroll a partir de los cuales se muestra

function actualizarBotonSubir() {
  botonSubir.classList.toggle('btn-subir--visible', window.scrollY > DISTANCIA_APARICION);
}

window.addEventListener('scroll', actualizarBotonSubir, { passive: true });
actualizarBotonSubir();

botonSubir.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: sinMovimiento.matches ? 'auto' : 'smooth' });
  // El botón se oculta al llegar arriba: se devuelve el foco al logo para no perderlo.
  document.querySelector('.logo-biblioteca').focus({ preventScroll: true });
});