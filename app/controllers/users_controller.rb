class UsersController < ApplicationController
    def create
        @user = User.create(
            username: params[:username],
            password: params[:password]
        )
        render json:{user: @user}, status: :created
    end
end
