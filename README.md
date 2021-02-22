## Snack Maps
Welcome to Snack Maps! This app lets you find resturaunts in a given location with a simple click of a button. As you make your way through the map, markers will spawn giving you a sneak peak of the resturaunts nearby. If you would like extra informatihttps://github.com/jay719/mod3-project-backendson on a particular restaurant, please scroll to the bottom to locate the resturaunts card.

**Snack Maps Backend-**https://github.com/jay719/mod3-project-backends
## Inspiration
Everyone loves food and when making this app I wanted the user to have as much control as possible when it comes to fullfilling their appetites. Our compettiters clog their screens up with unneccesary information that is more distracting than good. We on the other hand give you full control of what restuarants you see and how you see them!

## Technologies
Ruby
Rails
Javascript
SQLite3
Active Record

## Demo Video
N/A

## Setup
To access Snack Maps, users must clone this Github repository and open it in their code editor.
Install the Ruby gems by running "bundle install" and "bundle update" if things arent working properly.
Create your local database by running "rails db:migrate".
After migrating start up the back-end by running "rails s", and the front-end by running "lite-server", which will open the app in your browser.

## Instructions
Sign up for an account and then log in. Once logged in you should see your username in the top left hand corner of the page. From there you are able to access our "userClick" format of finding resturaunts as well as our search bar. Unlike its "click" counterpart, our search forum allows the user to customize which desired city, establishment, or cuisine they are looking for!

## Code Example
loginForm.addEventListener("submit", event => {
    event.preventDefault();
    
    const formData = new FormData (event.target)
    console.log(formData)
    fetch("http://localhost:3000/login", {
        method:"POST",
        headers:{
            "Content-type": "application/json",

        },
        body: JSON.stringify ({
            username: formData.get("username"),
            password: formData.get("password"),
    
        })

    }) .then(response => {
        if (!response.ok) throw new Error("Fam... you're embarrassing me")
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

class AuthenticationController < ApplicationController
    def login
        @user = User.find_by username: params[:username]

        if !@user 
            render json: { error: "No user with that username" }, status: :unauthorized
        else 
            if !@user.authenticate params[:password]
                render json: { message: "Incorrect, please try again"}, status: :unauthorized
            else
             payload = {
                    catchphrase: "Not the mama!",
                    user_id: @user.id
                }
                secret = "topsecret"
                token = JWT.encode payload, secret
                render json: { token: token, user: @user.username }, status: :created
            end
        end
    end
end

       
## Status
We are fixing the bug with the search option and have removed the code as to not confuse users.
## Contact
## Linkedin -Javaria Brascom
