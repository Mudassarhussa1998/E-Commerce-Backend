import pymongo
import sys

# Windows console encoding fix
sys.stdout.reconfigure(encoding='utf-8')

client = pymongo.MongoClient("mongodb://localhost:27017/ecommerce")
db = client["ecommerce"]
products_collection = db["products"]

# Check distinct image paths
distinct_images = products_collection.distinct("image")
print(f"Distinct image paths found: {distinct_images}")

# Check sample docs
products = products_collection.find({}, {"title": 1, "image": 1, "_id": 0}).limit(5)
for p in products:
    print(p)
