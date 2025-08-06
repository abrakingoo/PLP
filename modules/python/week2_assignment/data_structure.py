# Create an empty list called my_list.
my_list = []

# Append the following elements to my_list: 10, 20, 30, 40.
elements = [10, 20, 30, 40]
for element in elements:
    my_list.append(element)

# Insert the value 15 at the second position in the list.
my_list.insert(1, 15)

# Extend my_list with another list: [50, 60, 70].
another_list = [50, 60, 70]
my_list.extend(another_list)

# Remove the last element from my_list.
my_list.pop()

# Sort my_list in ascending order.
my_list.sort()

# Find and print the index of the value 30 in my_list.
index = my_list.index(30)
print(f'index of the value 30 is {index}')
