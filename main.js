$(document).ready(function() {
    $("#borrar").click(function(){
        localStorage.clear();
        location.reload();
    });
});

var fichas=[];
var configuracion;
var fin=false;

function shuffle(old_array) {
  var array = old_array.slice();
  var currentIndex = array.length, temporaryValue, randomIndex;

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

function get_word(s) {
    if (!s || s.length<2) return null;
    word = s.substr(1);
    return word;
}

function get_nombre(a) {
    var nombre = a || get_word(window.location.search) || get_word(window.location.hash);
    if (!nombre) {
        return null;
    }
    var nombres = localStorage.getItem('nombres');
    if (!nombres || !nombres.split(" ").includes(nombre)) {
        return null;
    }
    return nombre;
}

function save() {
    var data={}
    $("form *[name]").each(function() {
        data[this.id]=this.value;
        if (this.type=="checkbox") {
            data[this.id]=this.checked;
        }
    });
    data = JSON.stringify(data);
    var nombre = $("#nombre").val();
    var nuevo = !("data_"+nombre in localStorage)
    localStorage.setItem("data_"+nombre, data);

    var nombres = localStorage.getItem('nombres');
    if (!nombres) nombres = nombre;
    else {
        if (!nombres.split(" ").includes(nombre)) {
            nombres = nombres + " "+nombre;
        }
    }
    localStorage.setItem("nombres", nombres);
    return nuevo;
}

function run(ev) {
    var a = null;
    if (ev && ev.currentTarget && ev.currentTarget.href && ev.currentTarget.href.indexOf("#")) {
        a=ev.currentTarget.href.split("#")[1];
    }
    var nombre = get_nombre(a);
    if (!nombre) {
        $("#conf").show();
        $("#ver").hide();
        $("#dil").hide();
        return false;
    }
    var data = localStorage.getItem('data_'+nombre);
    configuracion = JSON.parse(data);
    for (k in configuracion) {
        var i=$("#"+k);
        if i.is(":file") continue;
        if (i.is(":checkbox")) {
            i.prop('checked', configuracion[k]);
        }
        else i.val(configuracion[k])
        i.change();
    }
    $("#nombre").val(nombre);
    var obj_fichas=null;
    if (configuracion["datos"]==1) {
        obj_fichas=movies_superhero;
    }
    else
    {
        var csv = localStorage.getItem("csv_"+configuracion["datos"]);
        if (!csv) {
            alert("Error inesperado. Vuelva a cargar el CSV.");
            return;
        }
        obj_fichas = JSON.parse(csv);
    }
    if (configuracion["shuffle"]) obj_fichas = shuffle(obj_fichas);
    $("#conf").hide();
    $("#ver").show();
    $("#dil").find(">div").remove();
    $("#dil").show();
    $("#dil legend").text(configuracion["pregunta"]);
    $("#count").text(obj_fichas.length - 1);
    var i, m, flag, div;
    for (i=0; i<obj_fichas.length; i++) {
        div = $("#dil").append("<div class='ficha'><div></div></div>").find("div.ficha:last div");
        m = obj_fichas[i];
        flag=true;
        for (k in m) {
            if (k) {
                if (flag) {
                    div.append("<h1>"+m[k]+"</h1>");
                    flag=false;
                } else {
                    div.append("<p>"+k+": "+m[k]+"</p>");
                }
            }
        }
    }
    $("#dil .ficha:hidden").not(".eliminada").slice(0, configuracion["num"]).show();
    $("#dil .ficha > div").click(function() {
        if (fin) return;
        var eliminar = $(this).closest(".ficha");
        if (configuracion["metodo"]==1) {
            eliminar = $("#dil .ficha:visible").not(eliminar);
        }
        var eliminadas = eliminar.length;
        eliminar.addClass("eliminada").hide();
        $("#dil .ficha:hidden").not(".eliminada").slice(0, eliminadas).show();
        var quedan = $("#dil .ficha:hidden").not(".eliminada").length + $("#dil .ficha:visible").length - 1;
        fin = quedan==0;
        $("#count").text(quedan);
    })
}


$(document).ready(function() {
    var nombres = localStorage.getItem('nombres');
    nombres = nombres?nombres.split(" "):[];
    var i, g;
    for (i=0; i<nombres.length; i++) {
        g=nombres[i];
        $("#menu").append(", <a class='guardado' href='#"+g+"'>"+g+"</a>").find("a:last").click(run);
    }
    for (k in localStorage) {
        if (k.startsWith("csv_")) {
            var csv = localStorage.getItem(k);
            var length = JSON.parse(csv).length - 1;
            var name = k.substr(4);
            $("#datos").append("<option value='"+name+"'>"+name+" ("+length+" fichas)</option>");
        }
    }
    run();
    $("#datos").change(function() {
        if (!this.value) {
            $("#csv").show();//.attr("required", "required").show();
        } else {
            $("#csv").hide();//.removeAttr("required");
        }
    }).change();
    $("form").submit(function() {
        var nombre=$("#nombre").val();
        window.location.hash=nombre;
        var nuevo = save();
        run();
        if(nuevo) $("#menu").append(", <a class='guardado' href='#"+nombre+"'>"+nombre+"</a>").find("a:last").click(run);
        return false;
    })
    $("#ver").click(function() {
        $("#conf").show();
    });
    $("#csv").bind("content", function(event, csv_content) {
        var name= this.files[0].name;
        var length = csv_content.length - 1;
        localStorage.setItem("csv_"+name, JSON.stringify(csv_content));
        var datos = $("#datos");
        datos.find("option[value='"+name+"']").remove();
        datos.append("<option value='"+name+"'>"+name+" ("+length+" fichas)</option>").val(name).change();
    }).change(handleFileSelect);
});
