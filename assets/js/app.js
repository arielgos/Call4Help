let items = [];
let markers = Array();
let path = null;
let paths = Array();
let center = {
    lat: -17.783443,
    lng: -63.183526
};
let map = null;
let firstCircle = null;

firebase.initializeApp({
    apiKey: "AIzaSyD40l3OXT6lWaQj7NE-lHtyE1L6__lBjNs",
    authDomain: "call4help-a06cf.firebaseapp.com",
    projectId: "call4help-a06cf",
    storageBucket: "call4help-a06cf.appspot.com",
    messagingSenderId: "831620338327",
    appId: "1:831620338327:web:e79622d2879bb9b5858fd2",
    measurementId: "G-MDW4VD2RP1"
});

firebase.auth().signInAnonymously()
    .then(() => {

    })
    .catch((error) => {
        console.error(error);
    });

firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        await firebase.firestore().collectionGroup('alerts')
            //.orderBy("date", "desc")
            .onSnapshot(querySnapshot => {
                querySnapshot.docChanges().forEach((change) => {
                    let doc = change.doc.data();
                    doc.distance = 0;
                    if (change.type === "added") {
                        items.push(doc);
                    }
                    if (change.type === "modified") {

                    }
                    if (change.type === "removed") {

                    }
                });

                loadItems();
                drawMarkers();
            });
    }
});

$(document).ready(function () {
    console.log("Start App");
    loadMap();
    loadItems();
    drawMarkers();

    $("#calc").click(function (event) {
        orderMarkers();
        loadItems();
        drawMarkers();
        event.preventDefault();
    });

    $("#print").click(function (event) {
        printMap();
        event.preventDefault();
    });
});

function renumerateItems() {
    $("ol li").each(function (index) {
        $(".index", this).html((index + 1).toString());
    });
}

function loadItems() {

    $(".items .list").html("");

    for (i = 0; i < items.length; i++) {
        let li = $("<li>", {
            latitude: items[i].latitude,
            longitude: items[i].longitude,
            id: items[i].id,
            name: items[i].description,
            status: items[i].status
        });
        let index = $("<div>", {class: "index"});
        let div = $("<div>", {
            class: "text",
            rowNumber: i
        });
        index.html((i + 1).toString());
        li.append(index);
        div.html(
            formatter.date(items[i].date.toDate()) + " [" + items[i].status + "]"
            + "<br><b class='title'>" + items[i].description + "</b>"
            + "<br><i>" + items[i].tags.replaceAll(',', ", ") + "</i>"
            + "<br><i>" + items[i].objects.replaceAll(',', ", ") + "</i>"
        );
        li.append(div);
        $(".items .list").append(li);
    }

    $(".items .list").sortable({
        onDrop: function ($item, container, _super) {
            renumerateItems();
            _super($item, container);
        }
    });

    $(".items .list .text").click(function () {
        let index = parseInt($(this).attr("rowNumber"));
        $("#alertModal #id").attr("rowNumber", index);
        $("#alertModal #id").html(items[index].id);
        $("#alertModal #date").html(formatter.date(items[index].date.toDate()));
        $("#alertModal #description").html(items[index].description);
        $("#alertModal #tags").html(items[index].tags);
        $("#alertModal #objects").html(items[index].objects);

        if (items[index].status.toLowerCase().includes("pendiente")) {
            $("#alertModal #pending").prop("checked", true);
        }
        if (items[index].status.toLowerCase().includes("proceso")) {
            $("#alertModal #inProgress").prop("checked", true);
        }
        if (items[index].status.toLowerCase().includes("cancelado")) {
            $("#alertModal #cancel").prop("checked", true);
        }
        if (items[index].status.toLowerCase().includes("solucionado")) {
            $("#alertModal #success").prop("checked", true);
        }

        $("#alertModal").modal('show');
    });

    $("#alertModal #save").click(function () {
        let index = parseInt($("#alertModal #id").attr("rowNumber"));
        let alert = items[index];

    });
}

function drawMarkers() {

    clearMarkers();

    $("ol li").each(function (index) {
        let marker = new google.maps.Marker({
            position: {
                lat: parseFloat($(this).attr("latitude")),
                lng: parseFloat($(this).attr("longitude"))
            },
            label: ((index + 1)).toString(),
            title: $(this).attr("name") + " [" + $(this).attr("status") + "]",
            map: map
        });
        markers.push(marker);
        paths.push({
            lat: parseFloat($(this).attr("latitude")),
            lng: parseFloat($(this).attr("longitude"))
        });
    });

    path = new google.maps.Polyline({
        path: paths,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    path.setMap(map);
}

function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = Array();
    paths = Array();
    if (path != null) {
        path.setMap(null);
    }
}

function loadMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: center
    });

    new google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map: map,
        center: center,
        radius: 100
    });
}

function printMap() {
    window.print();
}

function orderMarkers() {

    let first = null;
    let others = null;

    $("ol li").each(function (index) {
        if (index === 0) {
            first = Enumerable.From(items).Where("$.id=='" + $(this).attr("id") + "'").Select("$").FirstOrDefault();
            others = Enumerable.From(items).Where("$.id!='" + $(this).attr("id") + "'").Select("$").ToArray();
        }
    });

    let result = Array();
    result.push(first);
    getRoute(first, others, result);
    items = result;
}

function getRoute(first, others, result) {

    if (others.length > 0) {
        next = getNearest(first, others);
        result.push(next);
        others = Enumerable.From(others).Where("$.id!='" + next.id + "'").Select("$").ToArray();
        getRoute(next, others, result);
    }
}

function getNearest(first, others) {
    //calculamos las distancias
    for (let i = 0; i < others.length; i++) {
        others[i].distance = distanceBetween(first, others[i]);
    }
    return Enumerable.From(others).OrderBy("$.distance").FirstOrDefault();
}

function distanceBetween(point1, point2) {
    let a = point1.latitude - point2.latitude;
    let b = point1.longitude - point2.longitude;

    return Math.sqrt(a * a + b * b);
}

const formatter = {
    date: (date) => {
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours();
        let min = date.getMinutes();
        let sec = date.getSeconds();

        month = (month < 10 ? "0" : "") + month;
        day = (day < 10 ? "0" : "") + day;
        hour = (hour < 10 ? "0" : "") + hour;
        min = (min < 10 ? "0" : "") + min;
        sec = (sec < 10 ? "0" : "") + sec;

        return day + "/" + month + "/" + date.getFullYear() + " " + hour + ":" + min + ":" + sec;
    },
    money: (amount, decimalCount = 2, decimal = ".", thousands = ",") => {
        try {
            decimalCount = Math.abs(decimalCount);
            decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

            const negativeSign = amount < 0 ? "-" : "";

            let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
            let j = (i.length > 3) ? i.length % 3 : 0;

            return negativeSign +
                (j ? i.substr(0, j) + thousands : '') +
                i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) +
                (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
        } catch (e) {
            console.log(e)
        }
    }
};
