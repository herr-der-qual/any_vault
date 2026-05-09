from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from bot.keyboards.inline import finish_keyboard
from bot.utils.api_client import create_product
from bot.utils.format import format_product
from bot.utils.payload import build_api_payload

router = Router()


@router.callback_query(F.data == "finish")
async def handle_finish(callback: CallbackQuery, state: FSMContext):
    await finish(callback, state)


async def finish(message_or_callback, state: FSMContext):
    product = await state.get_data()
    if isinstance(message_or_callback, Message):
        product['telegram_id'] = message_or_callback.chat.id
    elif isinstance(message_or_callback, CallbackQuery):
        product['telegram_id'] = message_or_callback.message.chat.id
    else:
        raise ValueError(f"Unsupported type: {type(message_or_callback)}")

    try:
        api_response = await create_product(build_api_payload(product))
        await state.clear()

        text = format_product(product)
        message = message_or_callback.message if hasattr(message_or_callback, 'message') else message_or_callback
        await message.answer(f"{text}", reply_markup=finish_keyboard())

    except Exception as e:
        await state.clear()

        text = format_product(product)
        message = message_or_callback.message if hasattr(message_or_callback, 'message') else message_or_callback
        print(e)
        await message.answer(f"⚠️ Product created locally (API error: {str(e)})\n\n{text}", reply_markup=finish_keyboard())
