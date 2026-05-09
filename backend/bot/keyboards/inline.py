from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot.create_bot import storage


def navigation_keyboard(function=None):
    def wrapper(*args, **kwargs):
        navigation = kwargs.pop('navigation', None)
        if function:
            markup = function(*args, **kwargs)
        else:
            markup = InlineKeyboardMarkup(inline_keyboard=[])

        if not isinstance(markup, InlineKeyboardMarkup) or not navigation:
            return

        builder = InlineKeyboardBuilder()
        if navigation.get('back'):
            builder.button(text="⬅️ Back", callback_data=navigation['back'])
        if navigation.get('skip'):
            builder.button(text="⏭ Skip", callback_data=navigation['skip'])

        builder.adjust(2)
        markup.inline_keyboard.extend(builder.as_markup().inline_keyboard)

        return markup

    return wrapper


def category_keyboard():
    kb_list = [[InlineKeyboardButton(text=category, callback_data=f'select.category.{category}')]
               for category in storage['categories']
               ]

    return InlineKeyboardMarkup(inline_keyboard=kb_list)


@navigation_keyboard
def rating_keyboard(user: str):
    builder = InlineKeyboardBuilder()
    button_labels = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
    for i, label in enumerate(button_labels, start=1):
        builder.button(text=f'  {label}  ', callback_data=f"rate.{user}.{i}")

    builder.adjust(5, 5)

    return builder.as_markup()


def finish_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✏ Edit", callback_data="action.edit"),
            InlineKeyboardButton(text="+ New", callback_data="action.new"),
        ]
    ])
