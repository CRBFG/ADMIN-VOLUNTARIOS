// =====================================================
// EVITAR DOBLE CARGA
// =====================================================
if (window.__relacionesLoaded) {
  console.warn("relaciones.js ya fue cargado");
} else {
  window.__relacionesLoaded = true;

  document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // SUPABASE
    // =====================================================
    if (!window.supabase) {
      console.error("Supabase no está cargado");
      return;
    }

    if (!window.supabaseClient) {
      window.supabaseClient = window.supabase.createClient(
        "https://lfbzuvuvxyiivhwwcput.supabase.co",
        "sb_publishable_o5aqNEbTN6iL3myQUhYT0g_jKiaXKOK"
      );
    }

    const supabase = window.supabaseClient;

    // =====================================================
    // OBTENER CÓDIGO
    // =====================================================
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get("codigo");

    // =====================================================
    // ELEMENTOS
    // =====================================================
    const voluntarioEl = document.getElementById("voluntario");
    const capContainer = document.getElementById("capacitaciones-container");
    const espContainer = document.getElementById("especializaciones-container");
    const mensaje = document.getElementById("mensaje");

    const btnCap = document.getElementById("btn-add-cap");
    const btnEsp = document.getElementById("btn-add-esp");
    const btnActividades = document.getElementById("btn-actividades");

    // =====================================================
    // MOSTRAR VOLUNTARIO
    // =====================================================
    if (voluntarioEl) {
      voluntarioEl.textContent = `Voluntario: ${codigo || "No definido"}`;
    }

    // =====================================================
    // 🔥 NUEVO: IR A ACTIVIDADES
    // =====================================================
    window.irActividades = function (cod) {
      if (!cod) {
        alert("No hay código de voluntario");
        return;
      }
      window.location.href = `actividades.html?codigo=${cod}`;
    };

    if (btnActividades) {
      btnActividades.addEventListener("click", () => {
        window.irActividades(codigo);
      });
    }

    // =====================================================
    // CATÁLOGOS
    // =====================================================
    const LISTA_CAPACITACIONES = [
      "Acceso más seguro",
      "Formación Institucional Básica",
      "Combate de Incendio Forestal",
      "Curso primeros auxilios",
      "Elaboración de AVCA",
      "Curso primeros auxilios para mamá",
      "Gestión de riesgos",
      "Evacuación y rescate",
      "Atención en desastres",
      "Salud comunitaria",
      "Primeros auxilios avanzados"
    ];

    const LISTA_ESPECIALIZACIONES = [
      "Primera Línea / Brigadistas",
      "Formación para instructores",
      "Producción de Contenidos Digitales",
      "Instructora PAB",
      "Médico de Brigada",
      "Monitoreo Satelital y Detección de Focos de Calor",
      "Gestión de Equipos y Logística"
    ];

    // =====================================================
    // RENDER
    // =====================================================
    function renderCapacitacion(cap) {
      const div = document.createElement("div");

      div.innerHTML = `
        <input class="cap-nombre" value="${cap.nombre || ""}">
        <input class="cap-inicio" type="date" value="${cap.fecha_inicio || ""}">
        <input class="cap-fin" type="date" value="${cap.fecha_fin || ""}">
        <select class="cap-estado">
          <option value="completado" ${cap.estado === "completado" ? "selected" : ""}>Completado</option>
          <option value="en_progreso" ${cap.estado === "en_progreso" ? "selected" : ""}>En progreso</option>
        </select>
        <button onclick="actualizarCapacitacion('${cap.id}', this.parentElement)">💾</button>
        <button onclick="eliminarCapacitacion('${cap.id}', this.parentElement)">🗑</button>
        <hr>
      `;

      capContainer.appendChild(div);
    }

    function renderEspecializacion(esp) {
      const div = document.createElement("div");

      div.innerHTML = `
        <input class="esp-nombre" value="${esp.nombre || ""}">
        <button onclick="actualizarEspecializacion('${esp.id}', this.parentElement)">💾</button>
        <button onclick="eliminarEspecializacion('${esp.id}', this.parentElement)">🗑</button>
        <hr>
      `;

      espContainer.appendChild(div);
    }

    // =====================================================
    // AGREGAR
    // =====================================================
    window.agregarCapacitacion = function () {
      const div = document.createElement("div");

      div.innerHTML = `
        <select class="cap-select">
          <option value="">-- Seleccionar capacitación --</option>
          ${LISTA_CAPACITACIONES.map(c => `<option value="${c}">${c}</option>`).join("")}
          <option value="__otro__">Otro (escribir)</option>
        </select>

        <input class="cap-nombre" placeholder="Escribir capacitación" style="display:none;">

        <input class="cap-inicio" type="date">
        <input class="cap-fin" type="date">

        <select class="cap-estado">
          <option value="completado">Completado</option>
          <option value="en_progreso">En progreso</option>
        </select>

        <button onclick="guardarNuevaCapacitacion(this.parentElement)">➕ Guardar</button>
        <button onclick="this.parentElement.remove()">X</button>
        <hr>
      `;

      const select = div.querySelector(".cap-select");
      const input = div.querySelector(".cap-nombre");

      select.addEventListener("change", () => {
        input.style.display = select.value === "__otro__" ? "inline-block" : "none";
      });

      capContainer.appendChild(div);
    };

    window.agregarEspecializacion = function () {
      const div = document.createElement("div");

      div.innerHTML = `
        <select class="esp-select">
          <option value="">-- Seleccionar especialización --</option>
          ${LISTA_ESPECIALIZACIONES.map(e => `<option value="${e}">${e}</option>`).join("")}
          <option value="__otro__">Otro (escribir)</option>
        </select>

        <input class="esp-nombre" placeholder="Escribir especialización" style="display:none;">

        <button onclick="guardarNuevaEspecializacion(this.parentElement)">➕ Guardar</button>
        <button onclick="this.parentElement.remove()">X</button>
        <hr>
      `;

      const select = div.querySelector(".esp-select");
      const input = div.querySelector(".esp-nombre");

      select.addEventListener("change", () => {
        input.style.display = select.value === "__otro__" ? "inline-block" : "none";
      });

      espContainer.appendChild(div);
    };

    // =====================================================
    // BOTONES
    // =====================================================
    if (btnCap) btnCap.addEventListener("click", window.agregarCapacitacion);
    if (btnEsp) btnEsp.addEventListener("click", window.agregarEspecializacion);

    // =====================================================
    // GUARDAR
    // =====================================================
    window.guardarNuevaCapacitacion = async function (div) {
      const select = div.querySelector(".cap-select").value;
      const manual = div.querySelector(".cap-nombre").value.trim();

      const nombreFinal = select === "__otro__" ? manual : select;
      if (!nombreFinal) return;

      const nuevo = {
        voluntario_id: codigo,
        nombre: nombreFinal,
        estado: div.querySelector(".cap-estado").value,
        fecha_inicio: div.querySelector(".cap-inicio").value || null,
        fecha_fin: div.querySelector(".cap-fin").value || null
      };

      const { data, error } = await supabase.from("capacitaciones").insert([nuevo]).select();
      if (error) return console.error(error);

      div.remove();
      renderCapacitacion(data[0]);
    };

    window.guardarNuevaEspecializacion = async function (div) {
      const select = div.querySelector(".esp-select").value;
      const manual = div.querySelector(".esp-nombre").value.trim();

      const nombreFinal = select === "__otro__" ? manual : select;
      if (!nombreFinal) return;

      const nuevo = {
        voluntario_id: codigo,
        nombre: nombreFinal
      };

      const { data, error } = await supabase.from("especializaciones").insert([nuevo]).select();
      if (error) return console.error(error);

      div.remove();
      renderEspecializacion(data[0]);
    };

    // =====================================================
    // ACTUALIZAR / ELIMINAR
    // =====================================================
    window.actualizarCapacitacion = async (id, div) => {
      const { error } = await supabase.from("capacitaciones").update({
        nombre: div.querySelector(".cap-nombre").value.trim(),
        estado: div.querySelector(".cap-estado").value,
        fecha_inicio: div.querySelector(".cap-inicio").value || null,
        fecha_fin: div.querySelector(".cap-fin").value || null
      }).eq("id", id);

      if (error) console.error(error);
    };

    window.actualizarEspecializacion = async (id, div) => {
      const { error } = await supabase.from("especializaciones").update({
        nombre: div.querySelector(".esp-nombre").value.trim()
      }).eq("id", id);

      if (error) console.error(error);
    };

    window.eliminarCapacitacion = async (id, div) => {
      const { error } = await supabase.from("capacitaciones").delete().eq("id", id);
      if (!error) div.remove();
    };

    window.eliminarEspecializacion = async (id, div) => {
      const { error } = await supabase.from("especializaciones").delete().eq("id", id);
      if (!error) div.remove();
    };

    // =====================================================
    // CARGAR DATOS
    // =====================================================
    async function cargarDatos() {
      if (!codigo) return;

      const { data: caps } = await supabase.from("capacitaciones").select("*").eq("voluntario_id", codigo);
      const { data: esps } = await supabase.from("especializaciones").select("*").eq("voluntario_id", codigo);

      capContainer.innerHTML = "";
      espContainer.innerHTML = "";

      caps?.forEach(renderCapacitacion);
      esps?.forEach(renderEspecializacion);
    }

    cargarDatos();
  });
}