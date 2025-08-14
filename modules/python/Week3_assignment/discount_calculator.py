def calculate_discount(price, discount_percent):
    #calculates and return the new discounted price
    if discount_percent >= 20:
        discount_amount = (price * discount_percent) / 100
        return price - discount_amount
    else:
        return price

# get user input
price = int(input("Enter The Original Price Of The Item: "))
discount_percent = int(input("Enter The Discount Percentage: "))

# calculate the discout
discounted_price = calculate_discount(price, discount_percent)

# print results
if discounted_price < price:
    print(f'The Final Discounted Price Is {discounted_price}')
else:
    print(f'The Discount Was Less Than 20%, Price Remains: {discounted_price}')