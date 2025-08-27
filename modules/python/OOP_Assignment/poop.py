# Assignment 1: Design Your Own Class! 🏗️
class Smartphone:
    def __init__(self, model, price):
        self.model = model
        self.price = price

    def call(self, number):
        print(f"{self.model} is calling {number}...")

    def description(self):
        print(f'Brand: {self.model}\nPrice: {self.price}')

#  inheritance layer
class Gaming_SmartPhone(Smartphone):
    def __init__(self, model, price, gpu_model):
        super().__init__(model, price)
        self.gpu_model = gpu_model
        
     # Polymorphism: overriding call method
    def call(self, number):
        print(f"{self.model} (gaming mode) is calling {number} with GPU: {self.gpu_model}!")

    def play_game(self, game_name):
        print(f"{self.model} is playing {game_name} using {self.gpu_model}.")

# Testing
print("_" * 30 + "Testing SmartPhone Class" + "_" * 50)
phone = Smartphone("Nokia", "16500")
phone.call("0725359301")
phone.description()
print("_" * 30 + "Testing Gaming_SmartPhone Class " + "_" * 50)
GamingPhone = Gaming_SmartPhone("ROG Phone 8", 1299, "Adreno 730")
GamingPhone.call("072244867")
GamingPhone.description()
print("-" * 100)

# Activity 2: Polymorphism Challenge! 🎭
# Base class
class Transportation:
    def move(self):
        print("Moving...")

# Subclass: Car
class Car(Transportation):
    def move(self):
        print("Driving 🚗")

# Subclass: Plane
class Plane(Transportation):
    def move(self):
        print("Flying ✈️")

# Subclass: Boat
class Boat(Transportation):
    def move(self):
        print("Sailing 🚤")

# Subclass: Train
class Train(Transportation):
    def move(self):
        print("Chugging 🚆")

# Subclass: Bicycle
class Bicycle(Transportation):
    def move(self):
        print("Pedaling 🚴‍♂️")

# Polymorphism in action
print("_" * 30 + " Polymorphism Test " + "_" * 30)

# Create a list of transport objects
transports = [Car(), Plane(), Boat(), Train(), Bicycle()]

# Loop through and call move() polymorphically
for transport in transports:
    print(f"{transport.__class__.__name__}: ", end="")
    transport.move()

print("-" * 80)
