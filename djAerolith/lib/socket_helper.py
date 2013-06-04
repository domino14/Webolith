import redis
from django.conf import settings
import os
import json

TOKEN_EXPIRE_TIME = 30  # SECONDS.


def get_connection_token(user):
    token = os.urandom(16).encode('hex')
    r = redis.Redis(host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=settings.REDIS_SOCKET_TOKEN_DB)
    value = json.dumps({
        'username': user.username,
        'realm': 'lobby'})
    r.setex(token, value, TOKEN_EXPIRE_TIME)
    return token
