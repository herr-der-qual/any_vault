import pytest

from bot.utils.format import format_product


def test_format_product_full_data():
    product = {
        'category': 'Coffee',
        'brand': 'Nescafe',
        'variant': 'Espresso',
        'flavor': 'Caramel',
        'rating_arina': 8,
        'comment_arina': 'Smooth taste',
        'rating_andrew': 7,
        'comment_andrew': 'Too sweet',
    }
    expected = (
        "Category: Coffee\n"
        "Brand: Nescafe\n"
        "Variant: Espresso\n"
        "Flavor: Caramel\n"
        "\n"
        "🦖 Arina: 8/10\n"
        "💬 Smooth taste\n"
        "\n"
        "🌵 Andrew: 7/10\n"
        "💬 Too sweet"
    )
    assert format_product(product) == expected


def test_format_product_no_variant():
    product = {
        'category': 'Tea',
        'brand': 'Lipton',
        'flavor': 'Green',
        'rating_arina': 6,
        'comment_arina': None,
        'rating_andrew': 5,
        'comment_andrew': 'Bitter',
    }
    expected = (
        "Category: Tea\n"
        "Brand: Lipton\n"
        "Variant: \n"
        "Flavor: Green\n"
        "\n"
        "🦖 Arina: 6/10\n"
        "💬 —\n"
        "\n"
        "🌵 Andrew: 5/10\n"
        "💬 Bitter"
    )
    assert format_product(product) == expected


def test_format_product_no_comments():
    product = {
        'category': 'Juice',
        'brand': 'Tropicana',
        'variant': 'Fresh',
        'flavor': 'Orange',
        'rating_arina': 9,
        'rating_andrew': 8,
    }
    expected = (
        "Category: Juice\n"
        "Brand: Tropicana\n"
        "Variant: Fresh\n"
        "Flavor: Orange\n"
        "\n"
        "🦖 Arina: 9/10\n"
        "💬 —\n"
        "\n"
        "🌵 Andrew: 8/10\n"
        "💬 —"
    )
    assert format_product(product) == expected


def test_format_product_empty_string_comment():
    product = {
        'category': 'Coffee',
        'brand': 'Nescafe',
        'flavor': 'Caramel',
        'rating_arina': 8,
        'comment_arina': '',
        'rating_andrew': 7,
        'comment_andrew': '',
    }
    result = format_product(product)
    # empty string is falsy — same fallback as None
    assert "💬 —\n" in result
    assert result.endswith("💬 —")


def test_format_product_rating_boundary_min():
    product = {
        'category': 'Juice',
        'brand': 'Tropicana',
        'flavor': 'Orange',
        'rating_arina': 1,
        'rating_andrew': 1,
    }
    result = format_product(product)
    assert "🦖 Arina: 1/10" in result
    assert "🌵 Andrew: 1/10" in result


def test_format_product_rating_boundary_max():
    product = {
        'category': 'Juice',
        'brand': 'Tropicana',
        'flavor': 'Orange',
        'rating_arina': 10,
        'rating_andrew': 10,
    }
    result = format_product(product)
    assert "🦖 Arina: 10/10" in result
    assert "🌵 Andrew: 10/10" in result


def test_format_product_missing_category():
    product = {
        'brand': 'Nescafe',
        'variant': 'Espresso',
        'flavor': 'Caramel',
        'rating_arina': 8,
        'comment_arina': 'Smooth taste',
        'rating_andrew': 7,
        'comment_andrew': 'Too sweet',
    }
    with pytest.raises(KeyError, match="'category'"):
        format_product(product)


def test_format_product_missing_brand():
    product = {
        'category': 'Coffee',
        'variant': 'Espresso',
        'flavor': 'Caramel',
        'rating_arina': 8,
        'rating_andrew': 7,
    }
    with pytest.raises(KeyError, match="'brand'"):
        format_product(product)


def test_format_product_missing_flavor():
    product = {
        'category': 'Coffee',
        'brand': 'Nescafe',
        'variant': 'Espresso',
        'rating_arina': 8,
        'comment_arina': 'Smooth taste',
        'rating_andrew': 7,
        'comment_andrew': 'Too sweet',
    }
    with pytest.raises(KeyError, match="'flavor'"):
        format_product(product)


def test_format_product_missing_ratings():
    product = {
        'category': 'Coffee',
        'brand': 'Nescafe',
        'variant': 'Espresso',
        'flavor': 'Caramel',
        'comment_arina': 'Smooth taste',
        'comment_andrew': 'Too sweet',
    }
    with pytest.raises(KeyError, match="'rating_arina'"):
        format_product(product)
