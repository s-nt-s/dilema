class HTMLInputFileElement extends HTMLElement {
  static #selfAttr = {
    "read-as": Object.getOwnPropertyNames(FileReader.prototype)
      .flatMap((m) => {
        if (!m.startsWith("readAs")) return [];
        if (typeof FileReader.prototype[m] !== "function") return [];
        return [m.substring(6)];
      })
      .sort((a, b) => {
        if (a == "Text") return -99999999;
        if (b == "Text") return 99999999;
        return a.localeCompare(b);
      }),
  };
  static #flEvets = Object.getOwnPropertyNames(FileReader.prototype).flatMap(
    (prop) => {
      if (!prop.startsWith("on")) return [];
      const name = prop.slice(2);
      if (name.length == 0) return [];
      return [name];
    }
  );
  static #inputAttr = Object.getOwnPropertyNames(
    HTMLInputElement.prototype
  ).flatMap((prop) => {
    if (prop == "type") return false;
    const desElem = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      prop
    );
    if (desElem && (desElem.get || desElem.set)) return [];
    const desInput = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      prop
    );
    if (!(desInput && (desInput.get || desInput.set))) return [];
    return [prop.toLocaleLowerCase()];
  });

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "closed" });
    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.addEventListener("change", (e) => this.#handleFile(e));
    shadow.appendChild(this.input);
  }
  get readAs() {
    return this.getAttribute("read-as");
  }
  get acceptList() {
    return (this.getAttribute("accept")??"").trim().split(/[\s,]+/);
  }
  getAttribute(name) {
    const val = super.getAttribute.apply(this, arguments);
    const vls = HTMLInputFileElement.#selfAttr[name.toLocaleLowerCase()];
    if (!Array.isArray(vls)) return val;
    if (vls.includes(val)) return val;
    return vls[0];
  }
  setAttribute(name) {
    super.setAttribute.apply(this, arguments);
    const lw = name.toLocaleLowerCase();
    if (HTMLInputFileElement.#inputAttr.includes(lw))
      this.input.setAttribute(lw, this.getAttribute(lw));
  }
  removeAttribute(name) {
    super.removeAttribute.apply(this, arguments);
    const lw = name.toLocaleLowerCase();
    if (HTMLInputFileElement.#inputAttr.includes(lw))
      this.input.removeAttribute(lw);
  }
  #handleFile(e) {
    const fls = e.target?.files ?? [];
    Array.from(fls).forEach((f) => this.#read(f));
  }
  #isAccepted(file) {
    const accept = Array.from(this.acceptList);
    if (accept.length==0) return true;
    for (let i=0; i<accept.length; i++) if (file.name.endsWith(accept[i])) return true;
    return false;
  }
  #read(file) {
    const method = `readAs${this.readAs}`;
    if (!this.#isAccepted(file)) {
      this.#dispatch("error", {
        event: null,
        input: this,
        file: file,
        error: new TypeError(`File ${file.name} not ends in ${this.acceptList.join(', ')}`),
        result: null,
        method: method,
      });
      return;
    }
    const reader = new FileReader();
    HTMLInputFileElement.#flEvets.forEach((name) => {
      reader.addEventListener(name, (e) => {
        this.#dispatch(name, {
          event: e,
          input: this,
          file: file,
          error: reader.error,
          result: e.target?.result,
          method: method,
        });
      });
    });
    reader[method](file);
  }
  #dispatch(ev, detail) {
    this.dispatchEvent(
      new CustomEvent(ev, {
        detail: detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  static get observedAttributes() {
    return [
      ...new Set([
        ...HTMLInputFileElement.#inputAttr,
        ...Object.keys(HTMLInputFileElement.#selfAttr),
      ]),
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const lw = name.toLocaleLowerCase();
    if (HTMLInputFileElement.#inputAttr.includes(lw)) {
      if (newValue == null) this.input.removeAttribute(lw);
      else this.input.setAttribute(lw, newValue);
    }
    this.#validateAttributes();
  }
  #validateAttributes() {
    Object.entries(HTMLInputFileElement.#selfAttr).forEach(([name, vls]) => {
      if (!Array.isArray(vls)) return;
      const v = super.getAttribute(name);
      if (vls.includes(v)) return;
      const def = vls[0];
      if (def == null) return this.removeAttribute(name);
      this.setAttribute(name, def);
    });
  }
}

window.customElements.define("input-file", HTMLInputFileElement);
