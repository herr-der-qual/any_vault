from aiogram import Router
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.handlers.finish import finish
from bot.states import States

router = Router()


@router.message(States.comment_arina)
async def create_comment_arina(message: Message, state: FSMContext):
    text = message.text.strip()
    await state.update_data(
        comment_arina=text,
        telegram_id_arina=message.from_user.id
    )

    await state.set_state(States.rating_andrew)
    await message.answer(text=States.rating_andrew.text, reply_markup=States.rating_andrew.keyboard)


@router.message(States.comment_andrew)
async def create_comment_andrew(message: Message, state: FSMContext):
    text = message.text.strip()
    await state.update_data(
        comment_andrew=text,
        telegram_id_andrew=message.from_user.id
    )

    await finish(message, state)
