from typing import Dict, List, Optional, Any

import aiohttp
from decouple import config


class APIClient:
    """Client for interacting with the Django REST API from the bot"""

    def __init__(self):
        self.base_url = config('API_BASE_URL', default='http://localhost:8000/api')
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None,
                            params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to the API"""
        if not self.session:
            raise RuntimeError("APIClient must be used as async context manager")

        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        try:
            # For GET requests, use params for query string, for others use json data
            request_kwargs = {}
            if method.upper() == 'GET':
                if data:
                    # Convert data to query parameters for GET requests
                    request_kwargs['params'] = data
                elif params:
                    request_kwargs['params'] = params
            else:
                if data:
                    request_kwargs['json'] = data

            async with self.session.request(method, url, **request_kwargs) as response:
                # No content
                if response.status == 204:
                    return {}
                content_type = response.headers.get('Content-Type', '')
                # Prefer JSON when content-type is JSON
                if 'application/json' in content_type or content_type.endswith('+json'):
                    result = await response.json()
                else:
                    # Fallback to text for non-JSON responses (e.g., HTML errors)
                    text = await response.text()
                    if response.status >= 400:
                        raise Exception(f"API Error {response.status}: {text}")
                    # For successful non-JSON, return empty payload with raw text
                    return {'raw': text}

                if response.status >= 400:
                    raise Exception(f"API Error {response.status}: {result.get('error', result)}")

                return result
        except aiohttp.ClientError as e:
            raise Exception(f"Network error: {str(e)}")

    async def create_product(self, product) -> Dict[str, Any]:
        """Create a new product with optional nested ratings and comments"""
        return await self._make_request('POST', 'products/', product)

    async def get_products(self, category: Optional[str] = None,
                           group: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get products with optional filtering"""
        params = {}
        if category:
            params['category'] = category
        if group:
            params['group'] = group

        endpoint = 'products/'
        if params:
            query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
            endpoint += f"?{query_string}"

        return await self._make_request('GET', endpoint)

    async def update_product(self, product_id: int, **kwargs) -> Dict[str, Any]:
        """Update an existing product"""
        return await self._make_request('PUT', f'products/{product_id}/', kwargs)

    async def delete_product(self, product_id: int) -> bool:
        """Delete a product"""
        await self._make_request('DELETE', f'products/{product_id}/')
        return True

    async def add_rating(self, product_id: int, telegram_id: int, rating: int) -> Dict[str, Any]:
        """Add or update a rating for a product"""
        data = {
            'product_id': product_id,
            'telegram_id': telegram_id,
            'rating': rating
        }
        return await self._make_request('POST', 'products/ratings/', data)

    async def add_comment(self, product_id: int, telegram_id: int, comment: str) -> Dict[str, Any]:
        """Add a comment to a product"""
        data = {
            'product_id': product_id,
            'telegram_id': telegram_id,
            'comment': comment
        }
        return await self._make_request('POST', 'products/comments/', data)


async def create_product(product: Dict[str, Any]) -> Dict[str, Any]:
    """Create a product from bot state data"""
    async with APIClient() as client:
        return await client.create_product(product)


async def call_command(command, args):
    """Call a command"""
    async with E2EApiClient() as client:
        await client._make_request('GET', f'call-command/{command}', args)


class E2EApiClient(APIClient):
    def __init__(self):
        self.base_url = config('API_BASE_URL', default='http://localhost:8000/e2e')
        self.session = None