import json

with open('test_data.json', encoding='utf-8') as f:
    data = json.load(f)

# Find pets with images
pets_with_images = [p for p in data['pets'] if p.get('image_data')]

print(f"Total pets: {len(data['pets'])}")
print(f"Pets with images: {len(pets_with_images)}")

if pets_with_images:
    # Get last 3 with images
    last_3_with_images = pets_with_images[-3:]
    print("\nLast 3 pets WITH images:")
    for i, pet in enumerate(last_3_with_images, 1):
        print(f"\n{i}. Pet:")
        print(f"   user_id: {pet.get('user_id')}")
        print(f"   name: {pet.get('name')}")
        print(f"   stage: {pet.get('stage')}")
        print(f"   health: {pet.get('health')}")
        print(f"   image size: {len(pet.get('image_data', ''))} chars")
else:
    print("\nNo pets with images found!")


