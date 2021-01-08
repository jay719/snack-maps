Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html

  resources :users, only: [:create, :index]
  post "login", to: "authentication#login"
  get "securityhouses", to: "securityhouses#index"
end
