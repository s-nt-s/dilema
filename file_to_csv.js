function handleFileSelect(evt) {
  var files = evt.target.files;
  var file = files[0];
  if (!file) return;
  readCsvFile.apply(this, [file]);
}

function cleanCsvObject(obj) {
    var r=[];
    var i, k, v, o;
    for (i=0; i<obj.length;i++) {
        o=obj[i];
        delete o[""];
        var empty=true;
        for (k in o) {
            if (o[k]!="") empty=false;
        }
        if (!empty) r.push(o)
    }
    return r;
}

function readCsvFile(file) {
    var reader = new FileReader();
    reader.inputOrigin = this;
    reader.onerror = function () {
        alert("Error, vuélvalo a intentar si eso");
    }
    reader.onload = function(event){
        var csv = event.target.result;
        csv = $.csv.toObjects(csv ,{"separator":";"});
        csv = cleanCsvObject(csv);
        if (csv.length<2) {
            alert("El CSV ha de tener al menos 2 filas, y el separador ha de ser ;");
            return;
        }
        $(this.inputOrigin).trigger("content", [csv]);
    };
    reader.readAsText(file);
}
