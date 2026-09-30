import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


async def main():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    result = await db.products.update_many(
        {},
        {
            "$set": {
                "price": 1,
                "compare_at_price": 99
            }
        }
    )

    print(f"Updated products: {result.modified_count}")

    client.close()


asyncio.run(main())