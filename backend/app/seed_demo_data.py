from sqlalchemy import select

from app.database import SessionLocal, init_db
from app.models import MenuItem, Restaurant


DEMO_RESTAURANTS = [
    {
        "name": "Dream Restaurant",
        "address": "40940 Ryan Rd, Sterling Heights, MI 48310",
        "cuisine_type": "Middle Eastern",
        "menu_items": [
            ("Chicken Shawarma", "Chicken shawarma sandwich with garlic sauce and pickles."),
            ("Beef Shawarma", "Beef shawarma sandwich with classic toppings."),
            ("Chicken Escalope", "Breaded chicken escalope served as a plate or sandwich."),
            ("Shish Kabab", "Grilled kabab served with traditional sides."),
            ("Lamb Tikka", "Grilled lamb tikka served with rice or salad."),
            ("Shawarma with Fries", "Shawarma served with fries."),
        ],
    },
    {
        "name": "The Spot",
        "address": "10405 Ford Rd, Dearborn, MI 48126",
        "cuisine_type": "Tacos and Burgers",
        "menu_items": [
            ("Oklahoma Smashed Burger", "Two patties with grilled onions, peppers, American cheese, and The Spot sauce."),
            ("Birria Tacos with Cheese", "Birria tacos served with melted cheese."),
            ("Birria Ramen Noodles", "Ramen noodles served with birria-style meat and broth."),
            ("Loaded Turbo Fries", "Loaded fries with toppings and sauce."),
            ("Quesadilla Beef", "Beef quesadilla with cheddar cheese, onions, and parsley."),
        ],
    },
    {
        "name": "Blazin Grill",
        "address": "9240 Conant, Hamtramck, MI 48212",
        "cuisine_type": "Burgers and Subs",
        "menu_items": [
            ("Cheese Burger", "Single patty American cheeseburger with lettuce, tomato, and mayo."),
            ("Double Cheese Burger", "Double patty American cheeseburger."),
            ("Smash Burger", "American cheese, sauteed onions, lettuce, pickles, mayo, and special sauce."),
            ("Blazin Burger", "Double patty burger with bacon, cheese sticks, jalapenos, and Blazin sauce."),
            ("Steak Loaded Fries", "Fries topped with steak, grilled onions, peppers, mushrooms, cheese, and ranch."),
            ("Classic Turkey Sub", "Oven gold turkey sub with Swiss cheese, lettuce, tomatoes, and mayo."),
        ],
    },
    {
        "name": "NYC Halal Eats",
        "address": "5377 12 Mile Rd, Warren, MI 48092",
        "cuisine_type": "Halal",
        "menu_items": [
            ("Chicken Platter", "Chicken over rice with salad and fries."),
            ("Falafel Platter", "Falafel over rice with salad and fries."),
            ("Lamb Gyro", "Lamb gyro wrapped in pita bread."),
            ("Chop Cheese Hero", "Chopped cheese hero sandwich."),
            ("Wings", "Bone-in or boneless wings with sauce choices."),
            ("Waffles with Tenders", "Waffles served with chicken tenders."),
        ],
    },
    {
        "name": "Qahwah House",
        "address": "Sterling Heights, MI 48310",
        "cuisine_type": "Coffee and Tea",
        "menu_items": [
            ("Sana'ani", "Medium roast coffee with cardamom."),
            ("Mofawar", "Medium roast coffee with cardamom and cream."),
            ("Adeni Chai", "Yemeni black tea with cardamom, nutmeg, and evaporated milk."),
            ("Pistachio Latte", "Double shot espresso with pistachio milk."),
            ("Sabaya", "Yemeni pastry with buttery layered dough."),
            ("Khaliat Alnahl", "Honeycomb pastry with cream cheese filling and honey."),
        ],
    },
    {
        "name": "Hamido Restaurant",
        "address": "13251 W Warren Ave, Dearborn, MI 48126",
        "cuisine_type": "Lebanese",
        "menu_items": [
            ("Chicken Shawarma", "Chicken shawarma sandwich."),
            ("Meat Shawarma", "Meat shawarma sandwich."),
            ("Falafel Sandwich", "Falafel sandwich with traditional toppings."),
            ("Shish Tawook", "Grilled chicken tawook served as a plate or sandwich."),
            ("Farrouj Special", "Farrouj served with hummus, salad, and fries."),
            ("Hummus", "Classic hummus appetizer."),
        ],
    },
    {
        "name": "Prime Eatery",
        "address": "Masri Medical Building, 13530 Michigan Ave #120, Dearborn, MI 48126",
        "cuisine_type": "Burgers and Bowls",
        "menu_items": [
            ("Classic Burger", "Burger with pickles, cheddar jack cheese, ketchup, and mayo."),
            ("Mexicana Burger", "Burger with jalapeno popper, corn, fried onions, nacho cheese, and Prime sauce."),
            ("Nashville Chicken Sandwich", "Chicken sandwich with coleslaw, pickles, and Prime sauce."),
            ("Midwestern Bowl", "Chicken, fried onions, coleslaw, corn, Prime sauce, and fries."),
            ("Caesar Salad", "Lettuce, whole parmesan, garlic croutons, and Caesar dressing."),
            ("Chicken Nuggets", "Chicken nuggets served as an appetizer."),
        ],
    },
    {
        "name": "Chickpea Kitchen",
        "address": "39525 Mound Rd, Sterling Heights, MI 48310",
        "cuisine_type": "Mediterranean",
        "menu_items": [
            ("Original Hummus", "Chickpeas, tahini, garlic, and lemon dip."),
            ("Chickpea Salad", "Chickpeas, cucumbers, tomatoes, onions, and parsley."),
            ("Greek Salad", "Romaine, cucumbers, tomatoes, beets, chickpeas, olives, peppers, onions, and feta."),
            ("Lentil Soup", "Lentil soup served by cup, bowl, or quart."),
            ("Chicken Lemon Rice Soup", "Chicken lemon rice soup served by cup, bowl, or quart."),
            ("French Fries", "Classic French fries."),
        ],
    },
]


def seed_demo_data():
    init_db()
    db = SessionLocal()
    try:
        for restaurant_data in DEMO_RESTAURANTS:
            restaurant = db.scalar(
                select(Restaurant).where(Restaurant.name == restaurant_data["name"])
            )
            if not restaurant:
                restaurant = Restaurant(
                    name=restaurant_data["name"],
                    address=restaurant_data["address"],
                    cuisine_type=restaurant_data["cuisine_type"],
                )
                db.add(restaurant)
                db.flush()
            else:
                restaurant.address = restaurant_data["address"]
                restaurant.cuisine_type = restaurant_data["cuisine_type"]

            for item_name, description in restaurant_data["menu_items"]:
                existing_item = db.scalar(
                    select(MenuItem).where(
                        MenuItem.restaurant_id == restaurant.id,
                        MenuItem.name == item_name,
                    )
                )
                if not existing_item:
                    db.add(
                        MenuItem(
                            restaurant_id=restaurant.id,
                            name=item_name,
                            description=description,
                        )
                    )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
    print("Seeded LocalBite demo restaurants and menu items.")
