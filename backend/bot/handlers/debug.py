from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import Message
from datetime import datetime

from bot.keyboards.reply import main_keyboard
from bot.utils.api_client import create_product, call_command

router = Router()


@router.message(F.text == 'debug-reset')
async def debug_reset(message: Message, state: FSMContext):
    await state.clear()
    await call_command('flush', {'args': '--no-input'})
    await call_command('loaddata', {'args': 'users.json'})


@router.message(F.text == 'debug-1')
async def debug_1(message: Message):
    try:
        product_data = {
            'category': f'tmp-category-{datetime.now().timestamp()}',
            'variant': 'some',
            'telegram_id': 1,
            'username': 'testuser',
            'flavors': ['Original', 'Zero'],
            'groups': ['Family', 'Friends'],
            'ratings': [
                {'telegram_id': 1, 'rating': 9},
                {'telegram_id': 2, 'rating': 7},
            ],
            'comments': [
                {'telegram_id': 1, 'comment': 'Great!'},
                {'telegram_id': 2, 'comment': 'Nice'},
            ]
        }
        api_response = await create_product(product_data)
        await message.answer(f"Debug product saved!")
    except Exception as e:
        await message.answer(f"⚠️ Product created locally (API error: {str(e)})")

# missing unnecessary fields
@router.message(F.text == 'debug-2')
async def debug_2(message: Message):
    try:
        product_data = {
            'category': f'tmp-category-{datetime.now().timestamp()}',
            'variant': '',
            'telegram_id': 1,
            'username': 'testuser',
            'flavors': ['Original', 'Zero'],
            'groups': ['Family', 'Friends'],
            'ratings': [
                {'telegram_id': 1, 'rating': 9},
                {'telegram_id': 2, 'rating': 7},
            ],
            'comments': [
                {'telegram_id': 1, 'comment': 'Great!'},
                {'telegram_id': 2, 'comment': 'Nice'},
            ]
        }
        api_response = await create_product(product_data)
        await message.answer(f"Debug product saved!")
    except Exception as e:
        await message.answer(f"⚠️ Product created locally (API error: {str(e)})")
