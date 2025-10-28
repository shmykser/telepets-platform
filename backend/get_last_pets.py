import json

with open('test_data.json', encoding='utf-8') as f:
    data = json.load(f)

# Get last 3 pets
last_3_pets = data['pets'][-3:]

print("Last 3 pets:")
for i, pet in enumerate(last_3_pets, 1):
    print(f"\n{i}. Pet:")
    print(f"   user_id: {pet.get('user_id')}")
    print(f"   name: {pet.get('name')}")
    print(f"   stage/state: {pet.get('stage', 'N/A')}")
    print(f"   health: {pet.get('health')}")
    print(f"   has image: {bool(pet.get('image_data'))}")
    if pet.get('image_data'):
        print(f"   image size: {len(pet['image_data'])} chars")


