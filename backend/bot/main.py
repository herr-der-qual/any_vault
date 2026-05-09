import asyncio

from bot.create_bot import bot, dp
from bot.handlers.category import router as categories_router
from bot.handlers.brand import router as brand_router
from bot.handlers.comment import router as comments_router
from bot.handlers.finish import router as finish_router
from bot.handlers.flavor import router as flavors_router
from bot.handlers.rating import router as ratings_router
from bot.handlers.start import router as start_router
from bot.handlers.variant import router as variants_router
from bot.handlers.debug import router as debug_router


def register_routers():
    dp.include_router(start_router)
    dp.include_router(categories_router)
    dp.include_router(brand_router)
    dp.include_router(variants_router)
    dp.include_router(flavors_router)
    dp.include_router(ratings_router)
    dp.include_router(comments_router)
    dp.include_router(finish_router)
    dp.include_router(debug_router)


async def start_bot():
    pass


async def main():
    register_routers()
    dp.startup.register(start_bot)

    try:
        await bot.delete_webhook(drop_pending_updates=True)
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    finally:
        await bot.session.close()


if __name__ == '__main__':
    asyncio.run(main())
