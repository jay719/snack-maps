const btn1 = document.querySelector('#signup-btn');

const modal1 = document.getElementById('modal1');
const modal2 = document.getElementById('modal2');
const modalContent = document.getElementById('modal-content2')

const closer = document.getElementsByClassName('close')[0];
const closer2 = document.getElementsByClassName('close2')[0];

    btn1.onclick = function() {
    modal1.style.display = "block";
    }

    closer.onclick = function() {
    modal1.style.display = "none";
    }
    window.onclick = function(event) {
    if (event.target == modal1) {
        modal1.style.display = "none";
    }
    }

const signupForm = document.querySelector('.modal1-form')
const signupMessage = document.querySelector('.message')

signupForm.addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData (event.target)
    fetch("https://fathomless-stream-68461.herokuapp.com/users", {
        method:"POST",
        headers:{
            "Content-type": "application/json",

        },
        body: JSON.stringify ({
            username: formData.get("user_name"),
            password: formData.get("passphrase"),
        })
    }) .then(parseJSON)
    .then( response => {
        const { username, password_digest } = response.user
        console.log(username)
        // const username = response.user.username
        // const password = response.user.password
        signupMessage.textContent = `Your Snack Map Name is ${username}, and your password is: ... I hope you remember it when you sign in 😂`
    }).catch( error => {
        signupMessage.textContent = "What did you break 😡💢...confusion... Please contact javariab17@gmail.com"
    })
    event.target.reset()
})      
const loginForm = document.querySelector('#signin-form')
const loginMessage = document.querySelector('.message2')
const signinBtn = document.querySelector('#signin-btn')
signinBtn.addEventListener('click', (event) => {
    event.preventDefault();
     
    loginForm.classList.remove("hidden")
    console.log("clicked");


})





loginForm.addEventListener("submit", event => {
    event.preventDefault();
    
    const formData = new FormData (event.target)
    console.log(formData)
    fetch("https://fathomless-stream-68461.herokuapp.com/login", {
        method:"POST",
        headers:{
            "Content-type": "application/json",

        },
        body: JSON.stringify ({
            username: formData.get("username"),
            password: formData.get("password"),
    
        })

    }) .then(response => {
        if (!response.ok) throw new Error("Incorrect password. If you can not remember it please feel free to create a new user and contact us to delete the old one 👌🏾😄")
        return response.json()
    })
    .then( response => {
        
        loginMessage.innerHTML = ` <span id="imessage2">🐐 ${response.user} Signed in🐐</span> <br> You can... you can actually type?`
        loginForm.classList.add('hidden');
        loginMessage.classList.remove('hidden')
    }).catch( error => {
        loginMessage.textContent = error.message
        
    })
    const imessage = document.getElementById('imessage2')
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        console.log(scrolled);
        if (scrolled >= 32){
            imessage2.style.backgroundColor = "white"; 
            imessage2.style.left = "621px"
        imessage2.style.color = "gold";}
        
    })
    
    event.target.reset()
})      


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


var restaurantIcon= L.icon({
    iconUrl: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn2.iconfinder.com%2Fdata%2Ficons%2Fbuilding-vol-2%2F512%2Frestaurant-512.png&f=1&nofb=1',
    shadowUrl: 'shadow.png',

    iconSize:     [35, 40], // size of the icon
    shadowSize:   [20, 54], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [22, 94],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});
var playerIcon= L.icon({
    iconUrl: 'https://vignette.wikia.nocookie.net/characters/images/6/66/Kirby_(KRTDL).png/revision/latest?cb=20140622151800',
    shadowUrl: 'shadow.png',

    iconSize:     [35, 46], // size of the icon
    shadowSize:   [2, 2], // size of the shadow
    iconAnchor:   [2, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [-4, -1],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});


const welcomeMessage = '<h1>Hello User welcome to the app</h1>'

marker.bindPopup(welcomeMessage).openPopup();

let playerMarker = {};

const locationInfo = document.querySelector('.location');
let clickedURL = ""
var popup = L.popup();
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("The location of where you clicked has been saved, are you ready to find some food??" )
        .openOn(mymap);
        
    if (playerMarker != undefined) {
        mymap.removeLayer(playerMarker);
    };

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    locationInfo.innerHTML = `Latitude:${lat} <br> Longitude:${lng}`
    
    playerMarker = L.marker([lat, lng], {icon:playerIcon}).addTo(mymap);
    
    clickedURL = `https://developers.zomato.com/api/v2.1/geocode?lat=${lat}&lon=${lng}`;
    
}

mymap.on('click', onMapClick);

let video = document.querySelector('#video')
const comeOutButton = document.querySelector('.help-text')
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
const cost = document.querySelector('.cost');
console.log(cost)
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
    const cuisines = restaurant.cuisines
    const address = location.address;

    restaurantCard.append(title,img,ratingNumber,address, hiddenID);
    nearbySection.append(restaurantCard);
    console.log(restaurant)
    restaurantCard.onclick = function() {
        modal2.style.display = "block";
        modalImg.src = restaurant.featured_image;
        cardTitle.textContent = `${restaurant.name}-⭐${restaurant.user_rating.aggregate_rating}`;
        modalAddress.textContent = address;
        cost.textContent = `Average cost per date: $${restaurant.average_cost_for_two}`
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
    


