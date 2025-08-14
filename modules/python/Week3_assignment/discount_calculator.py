def calculate_discount(price, discount_percent):
    if price < 0 or discount_percent < 0:
        return "Invalid input. Price and discount must be non-negative."
    if discount_percent >= 20:
        discount_amount = (price * discount_percent) / 100
        return price - discount_amount
    return price

price = int(input("Enter The Original Price Of The Item: "))
discount_percent = int(input("Enter The Discount Percentage: "))
print(f'The Final Discounted Price Is {calculate_discount(price, discount_percent)}')