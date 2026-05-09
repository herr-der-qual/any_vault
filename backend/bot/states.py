from aiogram.fsm.state import State as AiogramState, StatesGroup as AiogramStatesGroup

from bot.keyboards.inline import category_keyboard, rating_keyboard, navigation_keyboard


class State(AiogramState):
    def __init__(self, options: dict):
        super().__init__()
        self.text = options['text']
        self.keyboard = options['keyboard']


class States(AiogramStatesGroup):
    category = State({
        'text': 'Select or create category:',
        'keyboard': category_keyboard()
    })
    brand = State({
        'text': 'Enter brand:',
        'keyboard': navigation_keyboard()(
            navigation={
                'back': 'go.to.category'
            },
        )
    })
    variant = State({
        'text': 'Enter variant:',
        'keyboard': navigation_keyboard()(
            navigation={
                'skip': 'go.to.flavor',
                'back': 'go.to.brand'
            },
        )
    })
    flavor = State({
        'text': 'Enter flavor:',
        'keyboard': navigation_keyboard()(
            navigation={
                'back': 'go.to.variant'
            }
        )
    })
    rating_arina = State({
        'text': 'Arina:',
        'keyboard': rating_keyboard(
            user='arina',
            navigation={
                'back': 'go.to.flavor'
            }
        )
    })
    comment_arina = State({
        'text': 'Comment from Arina:',
        'keyboard': navigation_keyboard()(
            navigation={
                'skip': 'go.to.rating.andrew',
                'back': 'go.to.rating.arina'
            }
        )
    })
    rating_andrew = State({
        'text': 'Andrew:',
        'keyboard': rating_keyboard(
            user='andrew',
            navigation={
                'back': 'go.to.comment.arina'
            }
        )
    })
    comment_andrew = State({
        'text': 'Comment from Andrew:',
        'keyboard': navigation_keyboard()(
            navigation={
                'skip': 'finish',
                'back': 'go.to.rating.andrew'
            }
        )
    })
