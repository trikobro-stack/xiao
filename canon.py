# KISS
def is_positive(num):
 if num > 0:
  print("Число положительное")
 else:
  print("Число отрецательное")


#  DRY
def validate_password(password):  
 if len(password) < 8 or not any(c.isdigit() for c in password):
  raise ValueError("Пароль слишком слабый")
 validate_password( password)

def register_user(username, password):
   validate_password(password)
   register_user(username, password)
   validate_password( password,username)

def change_password(user, new_password):
    validate_password(new_password) 
    change_password(user, new_password)


# YAGNI

def load(path):
  if format == "json":
    return load(path)

config = load("config.json")

      
