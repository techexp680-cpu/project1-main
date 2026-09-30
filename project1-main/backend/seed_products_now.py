import asyncio
import os
import random
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from models import Product, ProductReview, utc_now_iso
from seed_data import PRODUCTS, REVIEW_TEMPLATES

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


async def main():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    count = await db.products.count_documents({})
    print(f"Products before: {count}")

    inserted = 0

    for raw in PRODUCTS:
        data = dict(raw)

        data["price"] = 1
        data["compare_at_price"] = 99

        product = Product(**data)

        reviews = []
        for name, rating, comment in random.sample(
            REVIEW_TEMPLATES,
            k=min(3, len(REVIEW_TEMPLATES))
        ):
            reviews.append(
                {
                    "user_name": name,
                    "rating": rating,
                    "comment": comment,
                    "created_at": utc_now_iso(),
                }
            )

        product.reviews = [ProductReview(**review) for review in reviews]

        await db.products.update_one(
            {"slug": product.slug},
            {"$set": product.model_dump()},
            upsert=True,
        )

        inserted += 1

    count_after = await db.products.count_documents({})

    print(f"Seeded/updated products: {inserted}")
    print(f"Products after: {count_after}")

    client.close()


asyncio.run(main())