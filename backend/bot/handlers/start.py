from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message

from bot.keyboards.reply import main_keyboard

router = Router()


@router.message(CommandStart())
@router.message(F.text == '🔁')
async def cmd_start(message: Message):
    await message.answer("Done", reply_markup=main_keyboard())
