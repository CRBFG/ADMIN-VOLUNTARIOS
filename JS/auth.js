console.log("AUTH INICIADO");

(function () {

  const sesion = localStorage.getItem("sesion");
  const tiempo = localStorage.getItem("sesion_time");

  console.log("SESION DETECTADA:", sesion);
  console.log("TIEMPO SESION:", tiempo);

  const ahora = Date.now();
  const duracion = 1000 * 60 * 60 * 2; // 2 horas

  // ❌ sin sesión
  if (!sesion || sesion !== "ok") {
    console.log("ACCESO BLOQUEADO: SIN SESION");
    window.location.replace("login.html");
    return;
  }

  // ❌ sin timestamp
  if (!tiempo) {
    console.log("ACCESO BLOQUEADO: SIN TIEMPO");
    localStorage.clear();
    window.location.replace("login.html");
    return;
  }

  // ❌ sesión expirada
  if (ahora - parseInt(tiempo) > duracion) {
    console.log("ACCESO BLOQUEADO: SESION EXPIRADA");

    localStorage.clear();
    window.location.replace("login.html");
    return;
  }

})();