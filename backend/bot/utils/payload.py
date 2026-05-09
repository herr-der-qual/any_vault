def build_api_payload(product: dict) -> dict:
    payload = {
        'category': product['category'],
        'telegram_id': product['telegram_id'],
    }

    if product.get('brand'):
        payload['brand'] = product['brand']

    if product.get('variant'):
        payload['variant'] = product['variant']

    flavor_str = product.get('flavor', '')
    if flavor_str:
        payload['flavors'] = flavor_str.split()

    ratings = []
    if product.get('rating_arina') is not None and product.get('telegram_id_arina'):
        ratings.append({'telegram_id': product['telegram_id_arina'], 'rating': product['rating_arina']})
    if product.get('rating_andrew') is not None and product.get('telegram_id_andrew'):
        ratings.append({'telegram_id': product['telegram_id_andrew'], 'rating': product['rating_andrew']})
    if ratings:
        payload['ratings'] = ratings

    comments = []
    if product.get('comment_arina') and product.get('telegram_id_arina'):
        comments.append({'telegram_id': product['telegram_id_arina'], 'comment': product['comment_arina']})
    if product.get('comment_andrew') and product.get('telegram_id_andrew'):
        comments.append({'telegram_id': product['telegram_id_andrew'], 'comment': product['comment_andrew']})
    if comments:
        payload['comments'] = comments

    return payload
