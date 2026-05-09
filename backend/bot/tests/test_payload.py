import pytest

from bot.utils.payload import build_api_payload


BASE = {
    'category': 'Coffee',
    'telegram_id': 111111111,
}


def test_required_fields_only():
    result = build_api_payload(BASE)

    assert result['category'] == 'Coffee'
    assert result['telegram_id'] == 111111111
    assert 'brand' not in result
    assert 'variant' not in result
    assert 'flavors' not in result
    assert 'ratings' not in result
    assert 'comments' not in result


def test_brand_included_when_present():
    result = build_api_payload({**BASE, 'brand': 'Nescafe'})

    assert result['brand'] == 'Nescafe'


def test_brand_omitted_when_empty():
    result = build_api_payload({**BASE, 'brand': ''})

    assert 'brand' not in result


def test_variant_included_when_present():
    result = build_api_payload({**BASE, 'variant': 'Espresso'})

    assert result['variant'] == 'Espresso'


def test_variant_omitted_when_empty():
    result = build_api_payload({**BASE, 'variant': ''})

    assert 'variant' not in result


def test_single_flavor_becomes_list():
    result = build_api_payload({**BASE, 'flavor': 'Caramel'})

    assert result['flavors'] == ['Caramel']


def test_multiple_flavors_split_by_space():
    result = build_api_payload({**BASE, 'flavor': 'Watermelon Original'})

    assert result['flavors'] == ['Watermelon', 'Original']


def test_flavor_omitted_when_empty():
    result = build_api_payload({**BASE, 'flavor': ''})

    assert 'flavors' not in result


def test_flavor_omitted_when_missing():
    result = build_api_payload(BASE)

    assert 'flavors' not in result


def test_ratings_built_from_both_users():
    product = {
        **BASE,
        'rating_arina': 8,
        'telegram_id_arina': 111111111,
        'rating_andrew': 6,
        'telegram_id_andrew': 222222222,
    }
    result = build_api_payload(product)

    assert result['ratings'] == [
        {'telegram_id': 111111111, 'rating': 8},
        {'telegram_id': 222222222, 'rating': 6},
    ]


def test_ratings_only_arina():
    product = {
        **BASE,
        'rating_arina': 9,
        'telegram_id_arina': 111111111,
    }
    result = build_api_payload(product)

    assert result['ratings'] == [{'telegram_id': 111111111, 'rating': 9}]


def test_ratings_omitted_when_no_telegram_id():
    product = {**BASE, 'rating_arina': 8}

    result = build_api_payload(product)

    assert 'ratings' not in result


def test_ratings_omitted_when_missing():
    result = build_api_payload(BASE)

    assert 'ratings' not in result


def test_comments_built_from_both_users():
    product = {
        **BASE,
        'comment_arina': 'Smooth',
        'telegram_id_arina': 111111111,
        'comment_andrew': 'Bitter',
        'telegram_id_andrew': 222222222,
    }
    result = build_api_payload(product)

    assert result['comments'] == [
        {'telegram_id': 111111111, 'comment': 'Smooth'},
        {'telegram_id': 222222222, 'comment': 'Bitter'},
    ]


def test_comments_omitted_when_empty_string():
    product = {
        **BASE,
        'comment_arina': '',
        'telegram_id_arina': 111111111,
    }
    result = build_api_payload(product)

    assert 'comments' not in result


def test_comments_omitted_when_no_telegram_id():
    product = {**BASE, 'comment_arina': 'Good'}

    result = build_api_payload(product)

    assert 'comments' not in result


def test_full_payload():
    product = {
        'category': 'Energy Drink',
        'telegram_id': 111111111,
        'brand': 'Monster',
        'variant': 'Ultra',
        'flavor': 'Watermelon Original',
        'rating_arina': 8,
        'telegram_id_arina': 111111111,
        'comment_arina': 'Great',
        'rating_andrew': 6,
        'telegram_id_andrew': 222222222,
        'comment_andrew': 'Too sweet',
    }
    result = build_api_payload(product)

    assert result == {
        'category': 'Energy Drink',
        'telegram_id': 111111111,
        'brand': 'Monster',
        'variant': 'Ultra',
        'flavors': ['Watermelon', 'Original'],
        'ratings': [
            {'telegram_id': 111111111, 'rating': 8},
            {'telegram_id': 222222222, 'rating': 6},
        ],
        'comments': [
            {'telegram_id': 111111111, 'comment': 'Great'},
            {'telegram_id': 222222222, 'comment': 'Too sweet'},
        ],
    }
