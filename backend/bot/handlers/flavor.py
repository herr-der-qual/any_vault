from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery

from bot.states import States

router = Router()


@router.callback_query(F.data.contains('go.to.flavor'))
async def handle_callback(callback: CallbackQuery, state: FSMContext):
    await state.set_state(States.flavor)
    await callback.message.edit_text(text=States.flavor.text, reply_markup=States.flavor.keyboard)


@router.message(States.flavor)
async def create(message: Message, state: FSMContext):
    flavor = message.text.strip()
    await state.update_data(flavor=flavor)

    await state.set_state(States.rating_arina)
    await message.answer(States.rating_arina.text, reply_markup=States.rating_arina.keyboard)
