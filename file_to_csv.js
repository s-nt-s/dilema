class CsvReader {
  constructor(input, callback, minrows) {
    this.input = input;
    this.input.addEventListener("change", (ev) => {
      return this.handleFile(ev);
    });
    this.callback = callback;
    this.minrows = minrows == null || isNaN(minrows)?1:minrows;
  }
  handleFile(ev) {
    var files = ev.target.files;
    var file = files[0];
    if (!file) return false;
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
    const biStr = binary.reduce((data, byte) => data + String.fromCharCode(byte), '');

    const wb = XLSX.read(biStr, {
      type: "binary",
    });

    if (wb.SheetNames.length == 0) return null;
    const sh = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sh, {
      header: "A",
    });
    if (data == null || data.length<2) return null;
    const head = data[0];
    const rows = data.slice(1).map(o=>{
        return Object.fromEntries(
            Object.entries(o).map(([k, v]) => [head[k], v])
        )
    })
    return rows;
    /*
    const data = {};
    wb.SheetNames.forEach((name) => {
      const sh = wb.Sheets[name];
      const json = XLSX.utils.sheet_to_json(sh, {
        header: 1,
      });
      if (json.length) data[name] = json;
    });
    return data;
    */
  }
}
