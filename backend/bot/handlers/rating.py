from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery

from bot.states import States

router = Router()


@router.callback_query(F.data.contains('go.to.rating.arina'))
async def handle_callback_arina(callback: CallbackQuery, state: FSMContext):
    await state.set_state(States.rating_arina)
    await callback.message.edit_text(text=States.rating_arina.text, reply_markup=States.rating_arina.keyboard)


@router.callback_query(F.data.startswith("rate.arina."))
async def rate_arina(callback: CallbackQuery, state: FSMContext):
    rating = int(callback.data.split(".")[-1])
    await state.update_data(
        rating_arina=rating,
        telegram_id_arina=callback.from_user.id
    )

    await state.set_state(States.comment_arina)
    await callback.message.edit_text(States.comment_arina.text, reply_markup=States.comment_arina.keyboard)


@router.callback_query(F.data.contains('go.to.rating.andrew'))
async def handle_callback_andrew(callback: CallbackQuery, state: FSMContext):
    await state.set_state(States.rating_andrew)
    await callback.message.edit_text(text=States.rating_andrew.text, reply_markup=States.rating_andrew.keyboard)


@router.callback_query(F.data.startswith("rate.andrew."))
async def rate_andrew(callback: CallbackQuery, state: FSMContext):
    rating = int(callback.data.split(".")[-1])
    await state.update_data(
        rating_andrew=rating,
        telegram_id_andrew=callback.from_user.id
    )

    await state.set_state(States.comment_andrew)
    await callback.message.edit_text(States.comment_andrew.text, reply_markup=States.comment_andrew.keyboard)
