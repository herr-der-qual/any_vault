from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery

from bot.states import States

router = Router()


@router.callback_query(F.data.contains('go.to.brand'))
async def handle_callback(callback: CallbackQuery, state: FSMContext):
    await state.set_state(States.brand)
    await callback.message.edit_text(text=States.brand.text, reply_markup=States.brand.keyboard)


@router.message(States.brand)
async def create(message: Message, state: FSMContext):
    value = message.text.strip()
    await state.update_data(brand=value)

    await state.set_state(States.variant)
    await message.answer(text=States.variant.text, reply_markup=States.variant.keyboard)
