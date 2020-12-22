class User < ApplicationRecord
    has_secure_password #password digest
end
