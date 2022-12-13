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
        await firebase.firestore().collection('users').get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    console.log(doc.data());
                });
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
            lat: items[i].point.lat,
            lng: items[i].point.lng,
            code: items[i].code,
            name: items[i].name,
            address: items[i].address
        });
        let index = $("<div>", {class: "index"});
        let div = $("<div>", {class: "text"});
        index.html((i + 1).toString());
        li.append(index);
        div.html("[" + items[i].code + "] " + items[i].name);
        li.append(div);
        $(".items .list").append(li);
    }

    $(".items .list").sortable({
        onDrop: function ($item, container, _super) {
            renumerateItems();
            _super($item, container);
        }
    });

}

function drawMarkers() {

    clearMarkers();

    $("ol li").each(function (index) {
        let marker = new google.maps.Marker({
            position: {
                lat: parseFloat($(this).attr("lat")),
                lng: parseFloat($(this).attr("lng"))
            },
            label: ((index + 1)).toString(),
            title: "[" + $(this).attr("code") + "] " + $(this).attr("name") + " Dir: " + $(this).attr("address"),
            map: map
        });
        markers.push(marker);
        paths.push({
            lat: parseFloat($(this).attr("lat")),
            lng: parseFloat($(this).attr("lng"))
        });
    });

    //limpiamos el circulo del mapa
    if (firstCircle != null) {
        firstCircle.setMap(null);
    }

    firstCircle = new google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map: map,
        center: {
            lat: markers[0].position.lat(),
            lng: markers[0].position.lng()
        },
        radius: 100
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
        if (index == 0) {
            first = Enumerable.From(items).Where("$.code=='" + $(this).attr("code") + "'").Select("$").FirstOrDefault();
            others = Enumerable.From(items).Where("$.code!='" + $(this).attr("code") + "'").Select("$").ToArray();
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
        others = Enumerable.From(others).Where("$.code!='" + next.code + "'").Select("$").ToArray();
        getRoute(next, others, result);
    }
}

function getNearest(first, others) {
    //calculamos las distancias
    for (let i = 0; i < others.length; i++) {
        others[i].distance = distanceBetween(first.point, others[i].point);
    }
    return Enumerable.From(others).OrderBy("$.distance").FirstOrDefault();
}

function distanceBetween(point1, point2) {
    let a = point1.lat - point2.lat;
    let b = point1.lng - point2.lng;

    return Math.sqrt(a * a + b * b);
}
