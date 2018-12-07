$(document).ready(function () {

    let idCourse;

    let timer;
    let countdown;

    let animauxListe = [];
    let animauxInsc;

    const countries = $("#listePays");
    const animaux = $("#listeChien");

    const btnInsc = $("#insc");
    const btnInscChien = $("#chienInsc");
    const btnCloseCourse = $("#closeCourse");

    const tabAnimaux = $("#tabChiens");

    const rowDataCourse = $("#dataCourse");
    initListePays();

    btnInsc.on("click", clickInsc);

    function initListePays() {
        $.ajax({
            type: "GET",
            url: "./rqListePays.php",
            dataType: "json",
            async: false
        }).done(function (countriesData) {
            countries.empty();
            for (const country of countriesData) {
                countries.append(
                    $("<option>", {
                        value: country.codeP,
                        text: country.nomP
                    })
                );
            }
        });
    }

    function clickInsc() {
        let date = new Date();
        let course = {
            nomC: $("#course").val(),
            descC: "",
            dateC: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDay(),
            lieuC: countries.find(":selected").val()
        };

        $(this).attr("disabled", "disabled");

        $.ajax({
            type: "POST",
            url: "./rqInsertCourse.php",
            data: {course: JSON.stringify(course)},
            async: true
        }).done(function (courseId) {

            console.log(courseId);

            idCourse = courseId;

            $("#divCourse").show();

            $("#time").attr("disabled", "disabled");

            initListeChien();
            btnInscChien.on("click", clickInscChien);
            btnCloseCourse.on("click", clickCloseCourse);
        });
    }

    function initListeChien() {
        $.ajax({
            type: "GET",
            url: "./rqListeAnimaux.php",
            dataType: "json",
            async: true
        }).done(function (animauxData) {

            animaux.empty();

            animauxListe = objectMap(animauxData);

            for (const animal of animauxData) {
                animaux.append(
                    $("<option>", {
                        value: animal.idA,
                        text: animal.nomA
                    })
                );
            }
        });
    }

    function objectMap(object) {
        return Object.keys(object).reduce(function (result, key) {
            result[object[key].idA] = object[key];
            return result;
        }, {})
    }

    function clickInscChien() {
        let disabledAttr = animaux.find(":selected").attr("disabled");
        if (typeof disabledAttr === typeof undefined || disabledAttr === false) {

            animaux.find(":selected").attr("disabled", "disabled");
            let animal = animaux.find(":selected").val();
            tabAnimaux.append(
                $("<tr>", {
                    id: animal
                }).append(
                    $("<td>", {
                        class: "btnsCourse"
                    }).append(
                        $("<button>", {
                            id: "supprimerAnimal",
                            text: "Supprimer l'animal",
                            value: animal
                        }).on("click", supprAnimal)
                    )
                ).append(
                    $("<td>", {
                        text: animal
                    })
                ).append(
                    $("<td>", {
                        text: animauxListe[animal.toString()].nomA
                    })
                ).append(
                    $("<td>", {
                        text: animauxListe[animal.toString()].nationA
                    })
                ).append(
                    $("<td>", {
                        text: animauxListe[animal.toString()].descA
                    })
                )
            );

        }
    }

    function supprAnimal() {
        $("option[value=" + $(this).val() + "]").removeAttr("disabled");
        $("tr#" + $(this).val()).remove();
    }

    function clickCloseCourse() {
        rowDataCourse.html("");
        rowDataCourse.append(
            $("<button>", {
                id: "startCourse",
                text: "Start"
            }).on("click", clickStartCourse)
        ).append(
            $("<input>", {
                id: "tps",
                type: "text",
            })
        ).append(
            $("<label>", {
                for: "tpsRestant",
                text: " Temps restants :"
            })
        ).append(
            $("<input>", {
                id: "tpsRestant",
                type: "text"
            })
        );

        let tdBtnsCourse = $("td.btnsCourse");
        tdBtnsCourse.each(function () {

            let tr = $(this).closest("tr");

            $(this).html("");
            $(this).append(
                $("<button>", {
                    id: "chien:" + tr.attr("id"),
                    text: "Stop"
                }).on("click", stopCourse)
            ).append(
                $("<button>", {
                    id: "chien:" + tr.attr("id"),
                    text: "Abandon"
                }).on("click", abandonCourse)
            );
        });
    }

    function clickStartCourse() {
        $("#startCourse").attr("disabled", "disabled");

        startTimer();

    }

    function stopCourse() {
        let td = $(this).closest("td");
        $(this).closest("tr").addClass("achieved");
        td.html(timer.getTimeValues().toString(['hours', 'minutes', 'seconds'/*, 'secondTenths'*/]));
    }

    function abandonCourse() {
        let td = $(this).closest("td");
        $(this).closest("tr").addClass("achieved").addClass("abandon");
        td.html($("#time").val());
    }

    function startTimer() {

        let time = $("#time").val().split(":");

        timer = new Timer();
        timer.start({
            precision: 'secondTenths',
            target: {hours: Number(time[0]), minutes: Number(time[1]), seconds: Number(time[2]), secondTenths: 0}
        });
        timer.addEventListener('secondTenthsUpdated', function (e) {
            $("#tps").val(timer.getTimeValues().toString(['hours', 'minutes', 'seconds', 'secondTenths']));

            if ($("#tabChiens tr").not(".achieved").length <= 0) {
                timer.stop();
                countdown.stop();
                sendResult();
            }
        });

        countdown = new Timer();
        countdown.start({
            precision: 'secondTenths',
            countdown: true,
            startValues: {hours: Number(time[0]), minutes: Number(time[1]), seconds: Number(time[2]), secondTenths: 0}
        });
        countdown.addEventListener('secondTenthsUpdated', function (e) {
            $("#tpsRestant").val(countdown.getTimeValues().toString(['hours', 'minutes', 'seconds', 'secondTenths']));

        });

        timer.addEventListener('targetAchieved', function (e) {
            let notfinishedCourse = $("#tabChiens tr").not(".achieved");
            console.log(notfinishedCourse);

            notfinishedCourse.each(function () {
                $(this).find("td.btnsCourse").html($("#time").val());
                sendResult();
            });
        });
    }

    function sendResult() {
        let courses = $("#tabChiens tr");
        courses.each(function () {
            let resultat = {
                idC: idCourse,
                idA: Number($(this).attr("id")),
                temps: $(this).find("td.btnsCourse").html(),
                statut: $(this).hasClass("abandon") ? "A" : "T"
            };
            console.log(resultat);
            $.ajax({
                type: "POST",
                url: "./rqInsertResultat.php",
                data: {resultat: JSON.stringify(resultat)},
                async: true
            }).done(function (isOk) {
                if (isOk) {
                    console.log("Course terminé et résultat retenu !");
                }
                else {
                    console.log("Course terminé et résultat non retenu !");
                }
            });
        });

    }
});