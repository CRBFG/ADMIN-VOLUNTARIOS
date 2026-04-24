// =====================================================
// SUPABASE (UNA SOLA INSTANCIA GLOBAL)
// =====================================================

if (!window.supabaseClient) {
  const supabaseUrl = "https://lfbzuvuvxyiivhwwcput.supabase.co";
  const supabaseKey = "sb_publishable_o5aqNEbTN6iL3myQUhYT0g_jKiaXKOK";

  window.supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
  );
}

const db = window.supabaseClient;
const $ = (id) => document.getElementById(id);


// =====================================================
// UI - ÁREA MANUAL (OTRO)
// =====================================================

const areaSelect = $("area_select");
const areaManual = $("area_manual");

if (areaSelect && areaManual) {
  areaSelect.addEventListener("change", () => {
    if (areaSelect.value === "otro") {
      areaManual.style.display = "block";
      areaManual.required = true;
    } else {
      areaManual.style.display = "none";
      areaManual.value = "";
      areaManual.required = false;
    }
  });
}


// =====================================================
// PREVIEW DE IMAGEN
// =====================================================

const fotoInput = $("foto");
const preview = $("preview");

if (fotoInput && preview) {
  fotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (!file) {
      preview.style.display = "none";
      preview.src = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      preview.src = event.target.result;
      preview.style.display = "block";
    };

    reader.readAsDataURL(file);
  });
}


// =====================================================
// VALIDACIÓN BÁSICA
// =====================================================

function validarFormulario() {
  const nombre = $("nombre").value.trim();
  const apellido = $("apellido").value.trim();
  const ci = $("ci").value.trim();
  const telefono = $("telefono").value.trim();
  const anio = $("anio_ingreso").value;

  const areaFinal =
    areaSelect.value === "otro"
      ? areaManual.value.trim()
      : areaSelect.value;

  if (nombre.length < 2) {
    return "Nombre inválido";
  }

  if (apellido.length < 2) {
    return "Apellido inválido";
  }

  if (ci.length < 5) {
    return "CI inválido";
  }

  if (telefono && telefono.length < 6) {
    return "Teléfono inválido";
  }

  const year = parseInt(anio);
  const currentYear = new Date().getFullYear();

  if (!year || year < 1980 || year > currentYear + 1) {
    return "Año de ingreso inválido";
  }

  if (!areaFinal || areaFinal.length < 3) {
    return "Debe seleccionar un área válida";
  }

  return null;
}


// =====================================================
// GENERAR CÓDIGO AUTOMÁTICO
// =====================================================

async function generarCodigo() {
  const { data, error } = await db
    .from("voluntarios")
    .select("codigo");

  if (error || !data?.length) {
    return "crbf-gya-001";
  }

  let max = 0;

  data.forEach((item) => {
    if (!item.codigo) return;

    const partes = item.codigo.split("-");
    const numero = parseInt(partes[2]);

    if (!isNaN(numero) && numero > max) {
      max = numero;
    }
  });

  return `crbf-gya-${String(max + 1).padStart(3, "0")}`;
}


// =====================================================
// SUBIR FOTO A STORAGE
// =====================================================

async function subirFoto(file, codigo) {
  if (!file) {
    console.log("No se seleccionó archivo");
    return null;
  }

  const extension = file.name.split(".").pop();
  const fileName = `${codigo}-${Date.now()}.${extension}`;

  console.log("Subiendo archivo:", fileName);

  const { data, error } = await db.storage
    .from("FOTOSVOLUNTARIOS")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    console.log("ERROR STORAGE:", error);
    return null;
  }

  console.log("Upload correcto:", data);

  const { data: publicUrlData } = db.storage
    .from("FOTOSVOLUNTARIOS")
    .getPublicUrl(fileName);

  console.log("URL pública:", publicUrlData.publicUrl);

  return publicUrlData.publicUrl;
}


// =====================================================
// GUARDAR VOLUNTARIO
// =====================================================

const form = $("form-voluntario");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mensaje = $("mensaje");
    mensaje.textContent = "Procesando...";

    try {
      // VALIDACIÓN
      const errorValidacion = validarFormulario();

      if (errorValidacion) {
        mensaje.textContent = errorValidacion;
        return;
      }

      // GENERAR CÓDIGO
      const codigo = await generarCodigo();

      // FOTO
      const file = $("foto").files[0];
      const fotoUrl = await subirFoto(file, codigo);

      // ÁREA FINAL
      const areaFinal =
        areaSelect.value === "otro"
          ? areaManual.value.trim()
          : areaSelect.value;

      // OBJETO FINAL
      const nuevo = {
        codigo: codigo,
        nombre: $("nombre").value.trim(),
        apellido: $("apellido").value.trim(),
        ci: $("ci").value.trim(),
        telefono: $("telefono").value.trim(),
        area: areaFinal,
        estado: $("estado").value,
        anio_ingreso: parseInt($("anio_ingreso").value) || null,
        emergencia_nombre: $("contacto_nombre").value.trim(),
        emergencia_telefono: $("contacto_telefono").value.trim(),
        foto_url: fotoUrl
      };

      console.log("Insertando:", nuevo);

      // INSERT
      const { error } = await db
        .from("voluntarios")
        .insert([nuevo]);

      if (error) {
        console.log("ERROR INSERT:", error);
        mensaje.textContent = "Error al guardar en base de datos";
        return;
      }

      // MENSAJE DE ÉXITO
      mensaje.textContent = `Guardado correctamente: ${codigo}`;

      // 🔥 REDIRECCIÓN AUTOMÁTICA A FASE 2
      setTimeout(() => {
        window.location.href = `relaciones.html?codigo=${codigo}`;
      }, 800);

      // RESET
      form.reset();

      if (preview) {
        preview.style.display = "none";
        preview.src = "";
      }

      if (areaManual) {
        areaManual.style.display = "none";
      }

    } catch (err) {
      console.log("ERROR GENERAL:", err);
      mensaje.textContent = "Error inesperado del sistema";
    }
  });
}
