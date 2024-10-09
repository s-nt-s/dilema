class Page {
  constructor() {
    this.form = document.querySelector("form");
    this.nombre = document.getElementById("nombre");
    this.conf = document.getElementById("conf");
    this.ver = document.getElementById("ver");
    this.dil = document.getElementById("dil");
    this.count = document.getElementById("count");
    this.menu = document.getElementById("menu");
    this.datos = document.getElementById("datos");
    this.csv = document.getElementById("csv");
    this.borrar = document.getElementById("borrar");
  }
  get lsNombres() {
    return (localStorage.getItem("nombres") ?? "")
      .split(/\s+/)
      .filter((s) => s.length);
  }
  saveConfig() {
    const data = {};
    PAGE.form.querySelectorAll("*[name]").forEach((i) => {
      data[i.id] = i.value;
      if (i.type == "CHECKBOX") data[i.id] = this.checked;
    });
    const jdata = JSON.stringify(data);
    const nombre = PAGE.nombre.value;
    const isNew = !("data_" + nombre in localStorage);
    localStorage.setItem("data_" + nombre, jdata);

    const nombres = (() => {
      let ns = localStorage.getItem("nombres");
      if (!ns) return nombre;
      if (ns.split(" ").includes(nombre)) return ns;
      return ns + " " + nombre;
    })();
    localStorage.setItem("nombres", nombres);
    if (isNew) this.updateMenu();
  }
  get_current_nombre(ev) {
    const arr = [
      ev?.currentTarget?.href?.split("#")[1],
      window.location.search,
      window.location.hash,
    ]
      .flatMap((v) => {
        if (!v || v.length < 2) return [];
        v = v.substr(1);
        if (!this.lsNombres.includes(v)) return [];
        return v;
      })
      .filter((v) => v != null);
    if (arr.length == 0) return null;
    return arr[0];
  }
  updateMenu() {
    this.menu.querySelectorAll("span").forEach((a) => a.remove());
    this.lsNombres.forEach((g) => {
      this.menu.insertAdjacentHTML(
        "beforeend",
        `<span><a class='guardado' href='#${g}'>${g}</a></span>`
      );
    });
    this.menu
      .querySelectorAll("a")
      .forEach((a) => a.addEventListener("click", run));
  }
  updateDatos(selected) {
    this.datos
      .querySelectorAll("option[data-csv]")
      .forEach((a) => a.remove());
    Object.entries(localStorage).forEach(([k, v]) => {
      if (!k.startsWith("csv_")) return;
      const length = JSON.parse(v).length - 1;
      const name = k.substring(4);
      this.datos.insertAdjacentHTML(
        "beforeend",
        `<option data-csv value='${name}'${selected==k?" selected":""}>${name} (${length} fichas)</option>`
      );
    });

    this.datos.dispatchEvent(new Event("change"));
  }
}
let PAGE = null;

function shuffle(old_array) {
  const array = old_array.slice();
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function get_nombre(a) {
  const __parse = (v) => (!v || v.length < 2 ? null : v.substr(1));
  const nombre =
    a || __parse(window.location.search) || __parse(window.location.hash);
  if (!nombre) return null;

  const nombres = localStorage.getItem("nombres");
  if (!nombres || !nombres.split(" ").includes(nombre)) return null;

  return nombre;
}

function run(ev) {
  const nombre = PAGE.get_current_nombre(ev);
  if (!nombre) {
    PAGE.conf.classList.remove("hide");
    PAGE.ver.classList.add("hide");
    PAGE.dil.classList.add("hide");
    return false;
  }
  const data = localStorage.getItem("data_" + nombre);
  const configuracion = JSON.parse(data);
  for (k in configuracion) {
    let i = document.getElementById(k);
    if (i == null) continue;
    if (i.type == "file") continue;
    if (i.type == "checkbox") {
      i.checked = configuracion[k];
    } else {
      i.value == configuracion[k];
    }
    i.dispatchEvent(new Event("change"));
  }
  PAGE.nombre.value = nombre;

  let obj_fichas = (() => {
    if (configuracion["datos"] == 1) return movies_superhero;
    const csv = localStorage.getItem("csv_" + configuracion["datos"]);
    if (csv) return JSON.parse(csv);
    alert("Error inesperado. Vuelva a cargar el CSV.");
    return null;
  })();
  if (configuracion["shuffle"]) obj_fichas = shuffle(obj_fichas);

  document.querySelectorAll("#dil > div").forEach((n) => n.remove());
  document.querySelector("#dil legend").textContent = configuracion["pregunta"];
  PAGE.count.textContent = obj_fichas.length - 1;
  PAGE.conf.classList.add("hide");
  PAGE.ver.classList.remove("hide");
  PAGE.dil.classList.remove("hide");

  obj_fichas.forEach((m) => {
    PAGE.dil.insertAdjacentHTML(
      "beforeend",
      "<div class='ficha hide'><div></div></div>"
    );
    const div = PAGE.dil.querySelector("div.ficha:last-of-type div");
    Object.entries(m).forEach(([k, v], i) => {
      if (i == 0) div.insertAdjacentHTML("beforeend", "<h1>" + v + "</h1>");
      else div.insertAdjacentHTML("beforeend", "<p>" + k + ": " + v + "</p>");
    });
  });

  const fichas = Array.from(PAGE.dil.querySelectorAll(".ficha"));
  fichas.forEach((d) => {
    d.addEventListener("click", () => {
      if (parseInt(PAGE.count.textContent) == 0) return;
      const eliminar = (() => {
        if (configuracion["metodo"] != 1) return [d];
        return fichas.filter((f) => {
          if (f == d) return false;
          if (f.classList.contains("eliminada")) return false;
          if (f.classList.contains("hide")) return false;
          return true;
        });
      })();
      const eliminadas = eliminar.length;
      eliminar.forEach((e) => e.classList.add("eliminada"));
      restantes = fichas.filter(
        (e) =>
          e.classList.contains("hide") && !e.classList.contains("eliminada")
      );
      const mostrar = restantes.slice(0, eliminadas);
      mostrar.forEach((f) => f.classList.remove("hide"));
      PAGE.count.textContent = restantes.length;
    });
  });
  fichas
    .slice(0, configuracion["num"])
    .forEach((n) => n.classList.remove("hide"));
}

document.addEventListener("DOMContentLoaded", function () {
  PAGE = new Page();
  PAGE.borrar.addEventListener("click", () => {
    localStorage.clear();
    location.reload();
  });
  PAGE.datos.addEventListener("change", function () {
    PAGE.csv.classList[!this.value ? "remove" : "add"]("hide");
  });
  PAGE.updateMenu();
  PAGE.updateDatos();
  PAGE.form.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    window.location.hash = PAGE.nombre.value;
    PAGE.saveConfig();
    run();
    return false;
  });

  PAGE.ver.addEventListener("click", () => PAGE.conf.classList.remove("hide"));
  new CsvReader(
    PAGE.csv,
    (file, data) =>{
      const name = "csv_" + file.name;
      localStorage.setItem("csv_" + file.name, JSON.stringify(data));
      PAGE.updateDatos(name);
    },
    2
  )
  run();
  document.body.classList.remove("hide");
});
