from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery

from bot.states import States

router = Router()


@router.callback_query(F.data.contains('go.to.variant'))
async def handle_callback(callback: CallbackQuery, state: FSMContext):
    await state.set_state(States.variant)
    await callback.message.edit_text(text=States.variant.text, reply_markup=States.variant.keyboard)


@router.message(States.variant)
async def create(message: Message, state: FSMContext):
    variant = message.text.strip()
    await state.update_data(variant=variant)

    await state.set_state(States.flavor)
    await message.answer(text=States.flavor.text, reply_markup=States.flavor.keyboard)
