import sqlite3

def setup_database():
    conn = sqlite3.connect('drink_database.db')
    cursor = conn.cursor()

    # Create table for drinks
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS drinks (
        id INTEGER PRIMARY KEY,
        name TEXT,
        category TEXT,
        ingredients TEXT,
        amounts TEXT
    )
    ''')

    # Create table for bottles
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bottles (
        id INTEGER PRIMARY KEY,https://www.youtube.com/watch?v=O15QNrfkZQY&ab_channel=ZackPlauch%C3%A9
        name TEXT,
        volume INTEGER
    )
    ''')

    conn.commit()
    conn.close()

# Populate the database with drink data
def populate_drinks():
    conn = sqlite3.connect('drink_database.db')
    cursor = conn.cursor()

    drinks = [
        ("Margarita", "Cocktail", "Tequila,Limejuice,Triple sec", "4,2,1"),
        # Add more drinks here...
    ]

    cursor.executemany('INSERT INTO drinks (name, category, ingredients, amounts) VALUES (?, ?, ?, ?)', drinks)
    conn.commit()
    conn.close()

# Populate the database with bottle data
def populate_bottles():
    conn = sqlite3.connect('drink_database.db')
    cursor = conn.cursor()

    bottles = [
        ("Tequila", 70),
        ("Limejuice", 50),
        ("Triple sec", 50),
        # Add more bottles here...
    ]

    cursor.executemany('INSERT INTO bottles (name, volume) VALUES (?, ?)', bottles)
    conn.commit()
    conn.close()

setup_database()
populate_drinks()
populate_bottles()
