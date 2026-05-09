from aiogram.types import KeyboardButton, ReplyKeyboardMarkup


def main_keyboard():
    kb_list = [
        [KeyboardButton(text="➕ New"),
         KeyboardButton(text="✏ Edit")],

        [KeyboardButton(text='🔁'), KeyboardButton(text="🔎 Search")],
        [KeyboardButton(text='debug-reset')],
        [KeyboardButton(text='debug-1')],
        [KeyboardButton(text='debug-2')],
    ]

    keyboard = ReplyKeyboardMarkup(
        keyboard=kb_list,
        resize_keyboard=True,
        one_time_keyboard=False,
    )

    return keyboard
