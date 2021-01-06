
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

const circle = L.circle([39.90, -106.09], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(mymap);

const welcomeMessage = '<h1>Hello User welcome to the app</h1>'

marker.bindPopup(welcomeMessage).openPopup();
circle.bindPopup("I am a circle.");

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
        const location = restaurantIndex.restaurant.location;
        console.log(apiObject)
        const longitude = location.longitude;
        const latitude = location.latitude;
        console.log(latitude, longitude);
        const restaurantMarker = L.marker([latitude, longitude]).addTo(mymap);

})

)

function parseJSON(response){
return response.json()
}
   }