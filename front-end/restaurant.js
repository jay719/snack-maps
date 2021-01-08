const queryParams = new URLSearchParams(window.location.search)
const restaurantId = queryParams.get('restaurant_id')

const selectedResturauntURL = `https://developers.zomato.com/api/v2.1/restaurant?res_id=${restaurantId}`

fetch(selectedResturauntURL, {
    method: "GET",
    headers: {
        Accept: "application/json",
        "user-key": "a6631f3561d12ac2fa67b3d8cc55d409",
    },

})
    .then(parseJSON)
    .then(addRestaurantData)

function addRestaurantData(restaurant){
    console.log(restaurant)
}


function parseJSON(response){
        return response.json()
        }