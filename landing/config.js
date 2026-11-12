// Configuración editable de la landing. Es el único archivo que cambia entre versiones.
// Ver docs/08-Guia-Produccion.md, sección "Publicar una nueva versión".
window.KALENDARIA = {
  version: '1.1.0',
  // URL estable: siempre apunta al APK de la última release de GitHub.
  apkUrl: 'https://github.com/KBRGarcia/Kalendaria-App/releases/latest/download/kalendaria.apk',
  // Tamaño y huella del APK publicado. Déjalos vacíos hasta tener la release.
  apkSize: '93 MB',
  sha256: '9ff5bd0b17322b0b353763f9281aec23dc9d9804d5dbfa6833eda1c165c05ea8',
  minAndroid: '8.0',
  // Cuando exista la ficha de Play Store, pon aquí su URL y el botón se activa solo.
  playStoreUrl: '',
  githubUrl: 'https://github.com/KBRGarcia/Kalendaria-App',
  issuesUrl: 'https://github.com/KBRGarcia/Kalendaria-App/issues',
  // Correo de contacto público (opcional). Si está vacío se usa la página de Issues.
  contactEmail: '',
};
