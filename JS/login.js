const supabaseUrl = "https://lfbzuvuvxyiivhwwcput.supabase.co";
const supabaseKey = "sb_publishable_o5aqNEbTN6iL3myQUhYT0g_jKiaXKOK";

// Cliente Supabase
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// LOGIN GLOBAL
window.login = async function () {

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("error");

  errorBox.innerText = "";

  if (!username || !password) {
    errorBox.innerText = "Complete todos los campos";
    return;
  }

  // Consulta a Supabase
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .limit(1);

  if (error) {
    errorBox.innerText = "Error de conexión con el servidor";
    return;
  }

  if (!data || data.length === 0) {
    errorBox.innerText = "Usuario o contraseña incorrectos";
    return;
  }

  // 🧠 LIMPIAR SESIÓN ANTERIOR (evita bugs raros)
  localStorage.removeItem("sesion");
  localStorage.removeItem("sesion_time");
  localStorage.removeItem("usuario");
  localStorage.removeItem("rol");

  // 🔐 SESIÓN GLOBAL
  localStorage.setItem("sesion", "ok");
  localStorage.setItem("usuario", username);
  localStorage.setItem("sesion_time", Date.now());

  // opcional: rol
  if (data[0].rol) {
    localStorage.setItem("rol", data[0].rol);
  }

  // redirección
  window.location.href = "crear-voluntario.html";
};