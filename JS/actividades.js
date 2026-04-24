// =====================================
// ESPERAR DOM (IMPORTANTE)
// =====================================
document.addEventListener("DOMContentLoaded", () => {

  // =====================================
  // SUPABASE (UNA SOLA INSTANCIA GLOBAL)
  // =====================================
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

  // =====================================
  // OBTENER CÓDIGO
  // =====================================
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  const mensajeEl = $("mensaje");
  const voluntarioEl = $("voluntario");

  if (voluntarioEl) {
    voluntarioEl.textContent = `Voluntario: ${codigo || "No encontrado"}`;
  }

  if (!codigo && mensajeEl) {
    mensajeEl.textContent = "No se encontró el código del voluntario";
  }

  // =====================================
  // CATÁLOGO
  // =====================================
  const catalogo = {
    dref: {
      nombre: "Proyecto Dref Sequía e Incendio",
      descripcion: "Participación en acciones de respuesta ante sequía e incendios forestales.",
      rol: "Participante"
    },
    aspirantes: {
      nombre: "Capacitación Aspirantes",
      descripcion: "Formación básica para nuevos voluntarios.",
      rol: "Participante"
    },
    pandemia: {
      nombre: "Primer Respondiente Pandemia",
      descripcion: "Apoyo en acciones de respuesta sanitaria.",
      rol: "Participante"
    },
    primeros_auxilios: {
      nombre: "Curso Primeros Auxilios",
      descripcion: "Capacitación en atención prehospitalaria.",
      rol: "Participante"
    },
    fib: {
      nombre: "Formación Institucional Básica",
      descripcion: "Inducción institucional.",
      rol: "Participante"
    },
    ams: {
      nombre: "Acceso Más Seguro",
      descripcion: "Capacitación en seguridad operativa.",
      rol: "Participante"
    },
    incendio: {
      nombre: "Combate de Incendio Forestal",
      descripcion: "Entrenamiento en control de incendios.",
      rol: "Participante"
    }
  };

  // =====================================
  // ACTIVIDAD AUTOMÁTICA
  // =====================================
  window.cargarActividad = function () {
    const valor = $("actividad")?.value;
    const desc = $("descripcion");
    const rol = $("rol");
    const otro = $("actividadOtro");

    if (!valor || !desc || !rol || !otro) return;

    if (valor === "otro") {
      otro.style.display = "block";
      desc.value = "";
      return;
    }

    otro.style.display = "none";
    otro.value = "";

    const data = catalogo[valor];

    if (data) {
      desc.value = data.descripcion;
      rol.value = data.rol;
    }
  };

  // =====================================
  // ROL OTRO
  // =====================================
  const rolSelect = $("rol");
  const rolManual = $("rol_manual");

  if (rolSelect && rolManual) {
    rolSelect.addEventListener("change", function () {
      if (this.value === "Otro") {
        rolManual.style.display = "block";
        rolManual.required = true;
      } else {
        rolManual.style.display = "none";
        rolManual.value = "";
        rolManual.required = false;
      }
    });
  }

  // =====================================
  // VALIDACIÓN
  // =====================================
  function validarFormulario() {
    if (!codigo) return "Código de voluntario inválido";

    const actividad = $("actividad")?.value;
    const actividadOtro = $("actividadOtro")?.value.trim();
    const descripcion = $("descripcion")?.value.trim();
    const fechaInicio = $("fecha_inicio")?.value;

    const rol =
      $("rol").value === "Otro"
        ? $("rol_manual").value.trim()
        : $("rol").value;

    if (!actividad) return "Debe seleccionar una actividad";

    if (actividad === "otro" && (!actividadOtro || actividadOtro.length < 3)) {
      return "Debe especificar la actividad";
    }

    if (!descripcion || descripcion.length < 5) {
      return "Descripción inválida";
    }

    if (!fechaInicio) {
      return "Debe ingresar fecha de inicio";
    }

    if (!rol || rol.length < 3) {
      return "Rol inválido";
    }

    return null;
  }

  // =====================================
  // GUARDAR
  // =====================================
  const form = $("form-actividad");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!mensajeEl) return;

      // 🔒 evitar doble click
      form.querySelector("button[type='submit']").disabled = true;

      try {
        const errorValidacion = validarFormulario();

        if (errorValidacion) {
          mensajeEl.textContent = errorValidacion;
          form.querySelector("button[type='submit']").disabled = false;
          return;
        }

        // =========================
        // NOMBRE FINAL
        // =========================
        const actividadKey = $("actividad").value;
        const actividadOtro = $("actividadOtro").value.trim();

        const nombreFinal =
          actividadKey === "otro"
            ? actividadOtro
            : catalogo[actividadKey]?.nombre;

        if (!nombreFinal) {
          mensajeEl.textContent = "Nombre de actividad inválido";
          form.querySelector("button[type='submit']").disabled = false;
          return;
        }

        // =========================
        // DATOS
        // =========================
        const descripcion = $("descripcion").value.trim();
        const fechaInicio = $("fecha_inicio").value;
        const fechaFin = $("fecha_fin").value || null;

        const rol =
          $("rol").value === "Otro"
            ? $("rol_manual").value.trim()
            : $("rol").value;

        const status = $("status").value;
        const validFrom = $("valid_from").value || null;
        const validUntil = $("valid_until").value || null;

        // =========================
        // INSERT ACTIVIDAD
        // =========================
        const { data: actividad, error: errorActividad } = await db
          .from("actividades")
          .insert([
            {
              nombre: nombreFinal,
              descripcion,
              start_at: fechaInicio,
              end_at: fechaFin
            }
          ])
          .select()
          .single();

        if (errorActividad) {
          console.error(errorActividad);
          mensajeEl.textContent = "Error al crear actividad";
          form.querySelector("button[type='submit']").disabled = false;
          return;
        }

        const actividadId = actividad.id;

        // =========================
        // PARTICIPACIÓN
        // =========================
        const { error: errorParticipacion } = await db
          .from("participaciones")
          .insert([
            {
              voluntario_id: codigo,
              actividad_id: actividadId,
              rol
            }
          ]);

        if (errorParticipacion) {
          console.error(errorParticipacion);
          mensajeEl.textContent = "Error al guardar participación";
          form.querySelector("button[type='submit']").disabled = false;
          return;
        }

        // =========================
        // AUTORIZACIÓN
        // =========================
        const { error: errorAutorizacion } = await db
          .from("autorizaciones_evento")
          .insert([
            {
              voluntario_id: codigo,
              actividad_id: actividadId,
              status,
              valid_from: validFrom,
              valid_until: validUntil
            }
          ]);

        if (errorAutorizacion) {
          console.error(errorAutorizacion);
          mensajeEl.textContent = "Error al guardar autorización";
          form.querySelector("button[type='submit']").disabled = false;
          return;
        }

        // =========================
        // FINAL
        // =========================
        mensajeEl.textContent = "Guardado correctamente ✔";

        console.log("Redirigiendo a:",
          `https://crbfg.github.io/sistema-voluntarios/perfil.html?codigo=${codigo}`
        );

        setTimeout(() => {
          window.location.href =
            `https://crbfg.github.io/sistema-voluntarios/perfil.html?codigo=${codigo}`;
        }, 1200);

      } catch (err) {
        console.error("ERROR GENERAL:", err);
        mensajeEl.textContent = "Error inesperado del sistema";
        form.querySelector("button[type='submit']").disabled = false;
      }
    });
  }

});