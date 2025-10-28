import sqlite3
import json

conn = sqlite3.connect('telepets_dev.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

data = {}

# Users
cursor.execute('SELECT * FROM users')
data['users'] = [dict(row) for row in cursor.fetchall()]

# Pets
cursor.execute('SELECT * FROM pets')
data['pets'] = [dict(row) for row in cursor.fetchall()]

# Transactions
cursor.execute('SELECT * FROM transactions')
data['transactions'] = [dict(row) for row in cursor.fetchall()]

# Market listings
try:
    cursor.execute('SELECT * FROM market_listings')
    data['market_listings'] = [dict(row) for row in cursor.fetchall()]
except:
    data['market_listings'] = []

# Game scores
try:
    cursor.execute('SELECT * FROM game_scores')
    data['game_scores'] = [dict(row) for row in cursor.fetchall()]
except:
    data['game_scores'] = []

conn.close()

# Print summary
print(f"Users: {len(data['users'])}")
print(f"Pets: {len(data['pets'])}")
print(f"Transactions: {len(data['transactions'])}")
print(f"Market listings: {len(data['market_listings'])}")
print(f"Game scores: {len(data['game_scores'])}")
print("\nData exported!")

# Save to JSON
with open('test_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    
print("Saved to test_data.json")



