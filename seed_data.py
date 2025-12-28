import pymongo
from faker import Faker
import bcrypt
import random
from datetime import datetime, timedelta
import os
from bson.objectid import ObjectId

# Configuration
MONGO_URI = "mongodb://localhost:27017/ecommerce"
fake = Faker()

def get_database():
    client = pymongo.MongoClient(MONGO_URI)
    return client["ecommerce"]

def hash_password(password):
    # bcrypt requires bytes
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def seed_data():
    db = get_database()
    users_collection = db["users"]
    vendors_collection = db["vendors"]
    products_collection = db["products"]

    # Clear existing data to avoid mixing good and bad data
    users_collection.delete_many({})
    vendors_collection.delete_many({})
    products_collection.delete_many({})
    print("Cleared existing data.")

    print("Seeding Users...")
    users = []
    hashed_password = hash_password("password123")

    # Create 20 Users
    for _ in range(20):
        user = {
            "name": fake.name(),
            "email": fake.unique.email(),
            "password": hashed_password,
            "role": "user",
            "status": "active",
            "isEmailVerified": True,
            "isApproved": True,
            "addresses": [],
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }
        users.append(user)
    
    # Insert users
    if users:
        result = users_collection.insert_many(users)
        user_ids = result.inserted_ids
        print(f"Created {len(user_ids)} users.")
    else:
        user_ids = []

    print("Seeding Vendors...")
    vendors = []
    vendor_users = []
    
    # Create 10 Vendors (and their User accounts)
    for _ in range(10):
        # Create User for Vendor
        v_user = {
            "name": fake.name(),
            "email": fake.unique.email(),
            "password": hashed_password,
            "role": "vendor",
            "status": "active",
            "isEmailVerified": True,
            "isApproved": True,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }
        v_user_id = users_collection.insert_one(v_user).inserted_id
        vendor_users.append(v_user_id)

        # Create Vendor Profile
        company = fake.company()
        vendor = {
            "user": v_user_id,
            "shopName": company,
            "businessName": company + " LLC",
            "businessType": "Company",
            "contactPerson": v_user["name"],
            "phoneNumber": fake.phone_number(),
            "alternatePhone": fake.phone_number(),
            "email": v_user["email"],
            "businessAddress": {
                "street": fake.street_address(),
                "city": fake.city(),
                "state": fake.state(),
                "zipCode": fake.zipcode(),
                "country": fake.country()
            },
            "pickupAddress": {
                "street": fake.street_address(),
                "city": fake.city(),
                "state": fake.state(),
                "zipCode": fake.zipcode(),
                "country": fake.country()
            },
            "bankDetails": {
                "accountHolderName": v_user["name"],
                "accountNumber": fake.iban(),
                "bankName": "Fake Bank",
                "ifscCode": "FAKE0001",
                "branchName": "Main Branch"
            },
            "taxDetails": {
                "gstNumber": "GST" + str(random.randint(10000, 99999)),
                "panNumber": "PAN" + str(random.randint(10000, 99999))
            },
            "documents": {
                "businessLicense": "pending",
                "taxCertificate": "pending",
                "identityProof": "pending",
                "addressProof": "pending"
            },
            "status": "approved",
            "isActive": True,
            "isVerified": True,
            "totalProducts": 0,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }
        vendors.append(vendor)

    if vendors:
        v_result = vendors_collection.insert_many(vendors)
        vendor_ids = v_result.inserted_ids
        print(f"Created {len(vendor_ids)} vendors.")
    else:
        vendor_ids = []

    print("Seeding Products...")
    products = []
    
    # Unsplash Image Collections (Curated High Quality)
    images_by_category = {
        'Men': [
            "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80", # Men's Hoodie (Clean)
            "https://images.unsplash.com/photo-1593030761757-71bd90dbe3e4?auto=format&fit=crop&w=800&q=80", # Suit (Professional)
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80", # T-Shirt (White)
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80", # Jacket
            "https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&w=800&q=80", # T-Shirt (Mockup style)
            "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80", # Black T-Shirt (Flat)
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80", # Shirt (Folded)
            "https://images.unsplash.com/photo-1559551409-dadc959f76b8?auto=format&fit=crop&w=800&q=80", # Jeans
        ],
        'Women': [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", # Fashion Model (Clean)
            "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=800&q=80", # Black Dress
            "https://images.unsplash.com/photo-1550614000-4b9519e09d06?auto=format&fit=crop&w=800&q=80", # Top
            "https://images.unsplash.com/photo-1550418290-a8d86ad85ab2?auto=format&fit=crop&w=800&q=80", # Pants
            "https://images.unsplash.com/photo-1582142327305-64903328e121?auto=format&fit=crop&w=800&q=80", # Skirt
            "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=800&q=80", # T-Shirt (Women's)
            "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80", # White Clothes (Hanger)
        ],
        'Kids': [
            "https://images.unsplash.com/photo-1519238806101-512201f8d98d?auto=format&fit=crop&w=800&q=80", # Cute Kid
            "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=80", # Kid 2
            "https://images.unsplash.com/photo-1622290291353-ed07cefe83fb?auto=format&fit=crop&w=800&q=80", # Kids T-Shirt
            "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=80", # Kid
            "https://images.unsplash.com/photo-1604467794349-0b74285de7e7?auto=format&fit=crop&w=800&q=80", # Baby Clothes
        ],
        'Footwear': [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", # Nike (Red)
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80", # Shoes (Brown)
            "https://images.unsplash.com/photo-1560769629-975e13f0c470?auto=format&fit=crop&w=800&q=80", # Formal Leather
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80", # Sneakers (White)
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80", # Vans
            "https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=800&q=80", # Running Shoes
        ]
    }
    
    categories = ['Men', 'Women', 'Kids', 'Footwear']
    batch_vendor_ids = vendor_ids

    if not batch_vendor_ids:
        batch_vendor_ids = [v["_id"] for v in vendors_collection.find({}, {"_id": 1})]

    if not batch_vendor_ids:
        print("No vendors found to assign products to.")
        return

    for _ in range(50):
        category = random.choice(categories)
        vendor_id = random.choice(batch_vendor_ids)
        
        # Pick random image for category
        image_url = random.choice(images_by_category.get(category, images_by_category['Men']))
        
        product = {
            "title": fake.catch_phrase(),
            "subtitle": fake.bs(),
            "description": fake.paragraph(),
            "price": float(random.randint(1000, 50000)),
            "topCategory": category,
            "subCategory": "T-Shirts", # Simplified
            "stock": random.randint(10, 100),
            "vendor": vendor_id,
            "averageRating": round(random.uniform(3.5, 5.0), 1),
            "totalReviews": random.randint(0, 50),
            "isApproved": True,
            "isActive": True,
            "images": [image_url],
            "image": image_url,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }
        products.append(product)

    if products:
        products_collection.insert_many(products)
        print(f"Created {len(products)} products.")

    print("Seeding Completed!")

if __name__ == "__main__":
    seed_data()
