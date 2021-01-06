
  const mymap = L.map('mapid').setView([39.73892, -104.9850], 11);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibGltaXR0b2luZmluaXR5IiwiYSI6ImNrYmJzamt3dDA0YnQzMG1vbWh3NGIzaTEifQ.r2cKsjXwwnn6UiRRb_LHUA',
}).addTo(mymap);

const marker = L.marker([39.70, -104.989]).addTo(mymap);

// const circle = L.circle([39.71, -104.989], {
//     color: 'red',
//     fillColor: '#8470ff3',
//     fillOpacity: 0.5,
//     radius: 1000
// }).addTo(mymap);

var restaurantIcon= L.icon({
    iconUrl: 'restIcon.png',
    shadowUrl: 'shadow.png',

    iconSize:     [38, 50], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [22, 94],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

const welcomeMessage = '<h1>Hello User welcome to the app</h1>'

marker.bindPopup(welcomeMessage).openPopup();
// circle.bindPopup("I am a circle.");

var popup = L.popup();
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}

mymap.on('click', onMapClick);

const spawnURL = "https://developers.zomato.com/api/v2.1/geocode?lat=39.73892&lon=-104.9850";
const spawnButton = document.querySelector('#spawn')

spawnButton.addEventListener('click', findNearbyRestuaraunts)

function findNearbyRestuaraunts(event){ 
    event.preventDefault()
    fetch(spawnURL, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "user-key": "a6631f3561d12ac2fa67b3d8cc55d409",
        },
    
    })
    .then(parseJSON)
    .then(apiObject=> apiObject.nearby_restaurants.forEach(restaurantIndex => {
        const restaurant = restaurantIndex.restaurant
        const location = restaurant.location;
        const img = `<img src="${restaurant.featured_image}">`
        const name = restaurant.name
        // console.log(apiObject)
        console.log(restaurant);
        console.log(img);

        const longitude = location.longitude;
        const latitude = location.latitude;

        const restaurantMarker = L.marker([latitude, longitude], {icon:restaurantIcon}).addTo(mymap);
        restaurantMarker.bindPopup(name,img).openPopup();
})

)

function parseJSON(response){
return response.json()
}
   }