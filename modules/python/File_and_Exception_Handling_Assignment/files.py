# Prompt user for file name
file_name = input("Please Enter your file name: ")

try:
    with open(file_name, 'r') as file:
        data = file.readlines()
    
    with open('output.txt', 'w') as output_file:
        print(f"\nFile Found: {file_name}")
        print(f"Modifying File Content to upper Case....")
        for line in data:
            output_file.write(line.upper())

    # Read and print the content of output.txt
    with open('output.txt', 'r') as output_file:
        output_content = output_file.read()
        print(f"\nModified Content of '{file_name}':")
        print(output_content)

except FileNotFoundError:
    print(f"The file '{file_name}' was not found. Please check for typos or try a different file.")
