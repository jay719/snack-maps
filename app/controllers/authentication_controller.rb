class AuthenticationController < ApplicationController
    def login
        @user = User.find_by username: params[:username]

        if !@user 
            render json: { error: "No user with that username" }, status: :unauthorized
        else 
            if !@user.authenticate params[:password]
                render json: { message: "Nah bruh"}, status: :unauthorized
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
