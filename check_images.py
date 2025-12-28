import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017/ecommerce")
db = client["ecommerce"]
products_collection = db["products"]

products = products_collection.find({}, {"title": 1, "image": 1, "_id": 0}).limit(20)

print("Checking first 20 products:")
for p in products:
    print(p)
