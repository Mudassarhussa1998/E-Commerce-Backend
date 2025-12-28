import pymongo
import sys

with open("db_report.txt", "w", encoding="utf-8") as f:
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        f.write(f"Databases: {client.list_database_names()}\n")

        dbs = client.list_database_names()
        for db_name in dbs:
            if db_name in ['admin', 'local', 'config']:
                continue
            db = client[db_name]
            f.write(f"\nDatabase: {db_name}\n")
            
            if "users" in db.list_collection_names():
                count = db["users"].count_documents({})
                f.write(f"Users count: {count}\n")
                
                target = db["users"].find_one({"email": "testuser_debug@example.com"})
                if target:
                     f.write(f"!!! FOUND TARGET USER !!!: {target.get('email')} ID: {target.get('_id')}\n")
                else:
                     f.write("!!! TARGET USER NOT FOUND !!!\n")

                for user in db["users"].find():
                    f.write(f" - {user.get('email')}\n")
            
            if "vendors" in db.list_collection_names():
                count = db["vendors"].count_documents({})
                f.write(f"\nVendors count: {count}\n")
                target = db["vendors"].find_one({"email": "mudassarhussa1998@gmail.com"})
                if target:
                    f.write(f"!!! FOUND TARGET VENDOR !!!: {target.get('email')}\n")
                else:
                    f.write("!!! TARGET VENDOR NOT FOUND !!!\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
