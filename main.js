var fichas=[];
var configuracion;
var fin=false;

function get_json(js) {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': js,
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
}

function get_word(s) {
    if (!s || s.length<2) return null;
    word = s.substr(1);
    return word;
}

function get_nombre() {
    var nombre = get_word(window.location.search) || get_word(window.location.hash);
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
    });
    data = JSON.stringify(data);
    var nombre = $("#nombre").val();
    localStorage.setItem("data_"+nombre, data);

    var nombres = localStorage.getItem('nombres');
    if (!nombres) nombres = nombre;
    else {
        if (!nombres.split(" ").includes(nombre)) {
            nombres = nombres + " "+nombre;
        }
    }
    localStorage.setItem("nombres", nombres);
    
}

function run() {
    var nombre = get_nombre();
    if (!nombre) {
        $("#conf").show();
        $("#dil").hide();
        return false;
    }
    var data = localStorage.getItem('data_'+nombre);
    configuracion = JSON.parse(data);
    for (k in configuracion) {
        $("#"+k).val(data[k]);
    }
    $("#nombre").val(nombre);
    if (configuracion["datos"]!=1) {
        alert("No implementado aún");
        return false;
    }
    $("#conf").hide();
    $("#dil").show();
    $("#dil legend").text(configuracion["pregunta"]);
    $("#count").text(movies_superhero.length - 1);
    var i, m;
    for (i=0; i<movies_superhero.length; i++) {
        m = movies_superhero[i];
        $("#dil").append("<div class='ficha'><div><h1>"+m["title"]+"</h1><p>Año: "+m["year"]+"</p><p>Reparto: "+m["cast"].join(", ")+"</p></div></div>");
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
        $("#menu").append(", <a class='guardado' href='?"+g+"'>"+g+"</a>");
    }
    run();
    $("#datos").change(function() {
        if (this.value==0) {
            $("#csv").attr("required", "required").show();
        } else {
            $("#csv").removeAttr("required").hide();
        }
    }).change();
    $("form").submit(function() {
        js = $("#datos").val();
        if (js == 0) {
            alert("No implementado aún");
            return false;
        }
        //var json = get_json(js);
        window.location.hash=$("#nombre").val();
        save();
        run();
        return false;
    })
});
