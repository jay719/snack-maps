const btn1 = document.querySelector('#modalBtn1');

const modal1 = document.getElementById('modal1');
const modal2 = document.getElementById('modal2');
const modalContent = document.getElementById('modal-content2')

const closer = document.getElementsByClassName('close')[0];
const closer2 = document.getElementsByClassName('close2')[0];
       // When the user clicks on the button, open the modal
     btn1.onclick = function() {
       modal1.style.display = "block";
     }
       
       // When the user clicks on <span> (x), close the modal
     closer.onclick = function() {
       modal1.style.display = "none";
     }
       
       // When the user clicks anywhere outside of the modal, close it
     window.onclick = function(event) {
       if (event.target == modal1) {
         modal1.style.display = "none";
       }
    }

const signupForm = document.querySelector('.modal1 form')
const signupMessage = document.querySelector('.modal1 .message')

signupForm.addEventListener("submit", event => {
    event.preventDefault();
    const formData = new Formdata(event.target)
    fetch("http://localhost:3000/users", {
        method="POST",
        headers:{
            "Content-type": "application/json",

        },
        body: JSON.stringify ({
            username: formData.get("username"),
            password: formData.get("password"),
        })
    }) .then(parseJSON)
    .then( response => {
        const { username, password_digest } = response.user
        // const username = response.user.username
        // const password = response.user.password
        signupMessage.textContent = `Your Map Name is ${username}, and you're super secret phrase is ${password_digest}`
    })
    event.target.reset()
})      
        
    //     // When the user clicks anywhere outside of the modal, close it
    //   window.onclick = function(event) {
    //     if (event.target == modal2) {
    //       modal2.style.display = "none";
    //     }
    //  }

 
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

    iconSize:     [28, 40], // size of the icon
    shadowSize:   [20, 54], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [22, 94],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});
var playerIcon= L.icon({
    iconUrl: 'potatoe.png',
    shadowUrl: 'shadow.png',

    iconSize:     [35, 46], // size of the icon
    shadowSize:   [20, 54], // size of the shadow
    iconAnchor:   [2, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [-4, -1],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});


const welcomeMessage = '<h1>Hello User welcome to the app</h1>'

marker.bindPopup(welcomeMessage).openPopup();
// circle.bindPopup("I am a circle.");

const locationInfo = document.querySelector('.location');
let clickedURL = ""
var popup = L.popup();
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
        
        const lat= e.latlng.lat;
        const lng= e.latlng.lng;
        locationInfo.innerHTML = `Latitude:${lat} <br> Longitude:${lng}`
        const playerMarker = L.marker([lat, lng], {icon:playerIcon}).addTo(mymap);
        clickedURL = `https://developers.zomato.com/api/v2.1/geocode?lat=${lat}&lon=${lng}`;
       
}

mymap.on('click', onMapClick);

let video = document.querySelector('#video')
const comeOutButton = document.querySelector('.help-text')
// video.classlist.add('hidden')
console.log(video)
comeOutButton.addEventListener('click', (event) => {
    event.preventDefault();
     
    video.classList.remove("hidden")
    console.log("clicked");


})

const spawnButton = document.querySelector('#spawn');
spawnButton.addEventListener('click', findNearbyRestaurants)

function findNearbyRestaurants(event){ 
    event.preventDefault()
    fetch(clickedURL, {
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
        // console.log(restaurant);
        // console.log(img);

        const longitude = location.longitude;
        const latitude = location.latitude;
        const address = location.address;
        const ratingNumber = restaurant.user_rating.aggregate_rating;
        const ratingText = restaurant.user_rating.rating_text;


        const restaurantMarker = L.marker([latitude, longitude], {icon:restaurantIcon}).addTo(mymap);
        restaurantMarker.bindPopup(`<p style = "font-family: 'Ubuntu', sans-serif;font-size:16px"><b>${name}- <br>${address}</b>, <br>🌟${ratingNumber} ${ratingText}<p>`).openPopup();
        createNearbyCards(restaurantIndex)
    })

)
}
    
function parseJSON(response){
    return response.json()
    }

const nearbySection = document.querySelector('.nearby')
const modalImg = document.querySelector('.modal-img');
const cardTitle = document.querySelector('.card-title');
const modalAddress = document.querySelector('.address');

function createNearbyCards(restaurantIndex){
  
    const hiddenID = document.createElement('p');
    hiddenID.classList.add('hidden');
    hiddenID.textContent = restaurantIndex.restaurant.R.res_id;

    
    const restaurantCard = document.createElement('div')
    restaurantCard.classList.add("res-card")
    const restaurant = restaurantIndex.restaurant
    const location = restaurant.location;      


    const img = document.createElement('img')
    img.src = restaurant.featured_image
    img.alt = restaurant.name
    img.classList.add("card-img")

    const title = document.createElement('h1')
    title.textContent = restaurant.name


    const ratingNumber = document.createElement('p')
    ratingNumber.textContent = restaurant.user_rating.aggregate_rating;
    console.log(restaurant)
    const cuisines = restaurant.cuisines
    const address = location.address;

   
        // When the user clicks on <span> (x), close the modal
     
    restaurantCard.append(title,img,ratingNumber,address,hiddenID);
    nearbySection.append(restaurantCard);

    restaurantCard.onclick = function() {
        modal2.style.display = "block";
        modalImg.src = restaurant.featured_image;
        cardTitle.textContent = restaurant.name;
        modalAddress.textContent = address;
        modal2.append(hiddenID)
      }
    closer2.onclick = function() {
        modal2.style.display = "none";
        
        
      }
      window.onclick = function(event) {
        if (event.target == modal2) {
          modal2.style.display = "none";
        }
     }
    }
    
   
//        function findNearbyRestaurants(event){

//   const selectedResturauntURL = `https://developers.zomato.com/api/v2.1/restaurant?res_id=${restaurantId}`
       

//        fetch(selectedResturauntURL, {
//            method: "GET",
//            headers: {
//                Accept: "application/json",
//                "user-key": "a6631f3561d12ac2fa67b3d8cc55d409",
//            },
       
//        })
//            .then(parseJSON)
//            .then(addRestaurantData)
       
// function addRestaurantData(restaurant){
//            console.log(restaurant)
//        }




// function filterRestaurants(){ 
//     `https://developers.zomato.com/api/v2.1/search?entity_id=529&entity_type=city&cuisines=5`
//     } 
// const filter = document.querySelector('filter')
// filter.addEventListener('submit', (event) => {
//     event.preventDefault();
// })
       


