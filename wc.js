class SheetInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.minrows = 1;

    this.input = document.createElement("input");
    this.input.type = "file";
    this.updateInputAttribute();

    this.input.addEventListener("change", (event) => this.handleFile(event));

    this.shadowRoot.appendChild(this.input);
  }

  handleFile(ev) {
    if (!ev?.target?.files?.length) return false;
    const file = ev.target.files[0];
    this.read(file);
  }
  read(file) {
    const reader = new FileReader();
    reader.onerror = () => {
      alert("Error, vuélvalo a intentar si eso");
    };
    reader.onload = (event) => {
      const data = this.processResult(event.target.result);
      if (!Array.isArray(data))
        return alert("Error leyendo el fichero ¿esta vació?");
      if (data.length < this.minrows)
        return alert(`El fichero debe tener al menos ${this.minrows} filas`);
      this.callback(file, data);
    };
    reader.readAsArrayBuffer(file);
  }
  processResult(result) {
    const binary = new Uint8Array(result);
    const biStr = binary.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    );

    const wb = XLSX.read(biStr, {
      type: "binary",
    });

    if (wb.SheetNames.length == 0) return null;
    const sh = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sh, {
      header: "A",
    });
    if (data == null || data.length < 2) return null;
    const head = data[0];
    const rows = data.slice(1).map((o) => {
      return Object.fromEntries(
        Object.entries(o).map(([k, v]) => [head[k], v])
      );
    });
    return rows;
  }
  callback(file, data) {
    this.dispatchEvent(
      new CustomEvent("onread", {
        detail: {
          file: file,
          data: data,
        },
        bubbles: true,
        composed: true,
      })
    );
  }
  updateInputAttribute() {
    this.input.accept =
      this.getAttribute("accept") || ".csv, .xlsx, .xls, .ods";
  }

  static get observedAttributes() {
    return ["accept", "minrows"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "accept") this.updateInputAttribute();
    if (name === "minrows") {
      const v = parseInt(newValue);
      if (newValue == null || isNaN(v) || v < 1) return;
      this.minrows = v;
    }
  }
}

window.customElements.define("sheet-input", SheetInput);
