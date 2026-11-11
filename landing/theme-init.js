// Se ejecuta antes del primer pintado para evitar el parpadeo de tema.
(function () {
  try {
    var saved = localStorage.getItem('kalendaria:landing-theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (error) {
    // Sin almacenamiento: se respeta el tema del sistema.
  }
})();
